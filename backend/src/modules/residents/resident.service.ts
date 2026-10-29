import { Resident, IResident, ResidentCategory } from '../../models/resident.model';
import { Flat } from '../../models/flat.model';
import { Building } from '../../models/building.model';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import {
  CreateResidentInput,
  UpdateResidentInput,
  MoveOutInput,
  ReassignInput,
  ResidentQueryInput,
} from './resident.schema';

/**
 * Normalizes a full name for duplicate comparison (trimmed + collapsed spaces + lowercase).
 * This is a soft business rule, not a hard DB unique index, because the same
 * person may re-join a flat after moving out, and two different people could
 * theoretically share a name. The service-level check provides a clear error
 * message; the admin can override edge cases via explicit reassignment.
 */

/** Escapes RegExp special characters for safe literal matching. */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ResidentService {
  /**
   * Recalculate a flat's occupancyStatus from its active occupant records.
   *
   * Rules:
   *  - At least one active occupant with category TENANT → 'TENANTED'
   *  - Active occupants exist (none TENANT) → 'OCCUPIED'
   *  - No active occupants → 'VACANT'
   *
   * This is the single authoritative synchronization point.  Flat status is
   * always derived from resident records, never set directly by the client.
   */
  async syncFlatOccupancy(flatId: string): Promise<void> {
    const flat = await Flat.findOne({ _id: flatId, isDeleted: false });
    if (!flat) return; // Flat may have been archived; nothing to sync

    const activeOccupants = await Resident.find({
      flatId: flat._id,
      residencyStatus: 'ACTIVE',
      isOccupant: true,
      isDeleted: false,
    });

    let newStatus: 'VACANT' | 'OCCUPIED' | 'TENANTED' = 'VACANT';

    if (activeOccupants.length > 0) {
      const hasTenant = activeOccupants.some(
        (r) => r.residentCategory === 'TENANT'
      );
      newStatus = hasTenant ? 'TENANTED' : 'OCCUPIED';
    }

    if (flat.occupancyStatus !== newStatus) {
      flat.occupancyStatus = newStatus;
      await flat.save();
    }
  }

  /**
   * Paginated, filtered resident directory.
   */
  async getResidents(
    query: ResidentQueryInput
  ): Promise<{ residents: IResident[]; meta: any }> {
    const filter: any = { isDeleted: false };

    if (query.flatId) {
      filter.flatId = query.flatId;
    }

    if (query.category) {
      filter.residentCategory = query.category;
    }

    if (query.residencyStatus) {
      filter.residencyStatus = query.residencyStatus;
    }

    if (query.isOccupant !== undefined) {
      filter.isOccupant = query.isOccupant === 'true';
    }

    if (query.buildingId) {
      // Look up flat IDs belonging to the building
      const buildingFlats = await Flat.find({
        buildingId: query.buildingId,
        isDeleted: false,
      }).distinct('_id');
      filter.flatId = { $in: buildingFlats };
    }

    if (query.search) {
      filter.fullName = { $regex: query.search.trim(), $options: 'i' };
    }

    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const [residents, total] = await Promise.all([
      Resident.find(filter)
        .populate({
          path: 'flatId',
          select: 'flatNumber floor occupancyStatus buildingId',
          populate: {
            path: 'buildingId',
            select: 'name totalFloors',
          },
        })
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit),
      Resident.countDocuments(filter),
    ]);

    return {
      residents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve a single resident by ID.
   * Populates flat and building info for display.
   */
  async getResidentById(id: string): Promise<IResident> {
    const resident = await Resident.findOne({ _id: id, isDeleted: false }).populate(
      {
        path: 'flatId',
        select: 'flatNumber floor occupancyStatus buildingId',
        populate: {
          path: 'buildingId',
          select: 'name totalFloors',
        },
      }
    );
    if (!resident) {
      throw new NotFoundError(`Resident with ID ${id} not found.`);
    }
    return resident;
  }

  /**
   * Internal lookup without populate — preserves raw ObjectId for flatId.
   * Used by operations that need the flatId as a string for occupancy sync.
   */
  private async getResidentRaw(id: string): Promise<IResident> {
    const resident = await Resident.findOne({ _id: id, isDeleted: false });
    if (!resident) {
      throw new NotFoundError(`Resident with ID ${id} not found.`);
    }
    return resident;
  }

  /**
   * Populate a resident's flat and building info for the API response.
   */
  private async populateResident(resident: IResident): Promise<IResident> {
    return await resident.populate({
      path: 'flatId',
      select: 'flatNumber floor occupancyStatus buildingId',
      populate: {
        path: 'buildingId',
        select: 'name totalFloors',
      },
    });
  }

  /**
   * Retrieve all residents for a specific flat (current + historical).
   */
  async getResidentsByFlat(flatId: string): Promise<IResident[]> {
    // Verify the flat exists
    const flat = await Flat.findOne({ _id: flatId, isDeleted: false });
    if (!flat) {
      throw new NotFoundError(`Flat with ID ${flatId} not found.`);
    }

    return Resident.find({ flatId, isDeleted: false })
      .sort({ residencyStatus: -1, fullName: 1 }) // Active first, then alphabetical
      .populate({
        path: 'flatId',
        select: 'flatNumber floor occupancyStatus buildingId',
        populate: {
          path: 'buildingId',
          select: 'name totalFloors',
        },
      });
  }

  /**
   * Create a new resident record.
   *
   * Validates:
   *  - The flat exists and belongs to the active society
   *  - The person is not already an active resident in the same flat (duplicate)
   *  - The person is not already an active resident in a different flat
   * Then synchronizes the flat's occupancy status.
   */
  async createResident(input: CreateResidentInput): Promise<IResident> {
    // 1. Verify the flat exists and is active
    const flat = await Flat.findOne({ _id: input.flatId, isDeleted: false });
    if (!flat) {
      throw new NotFoundError('Associated flat does not exist.');
    }

    // 2. Verify the flat's building exists and is active
    const building = await Building.findOne({ _id: flat.buildingId, isDeleted: false });
    if (!building) {
      throw new NotFoundError('Associated building does not exist.');
    }

    // 3. Check for duplicate active resident in the same flat (case-insensitive)
    const trimmedName = input.fullName.trim();
    const namePattern = new RegExp(`^${escapeRegExp(trimmedName)}$`, 'i');

    const existingInFlat = await Resident.findOne({
      flatId: flat._id,
      residencyStatus: 'ACTIVE',
      isDeleted: false,
      fullName: { $regex: namePattern },
    });

    if (existingInFlat) {
      throw new ConflictError(
        `An active resident named '${trimmedName}' already exists in this flat.`
      );
    }

    // 4. Check if the person is already active in a different flat
    const existingInOtherFlat = await Resident.findOne({
      flatId: { $ne: flat._id },
      residencyStatus: 'ACTIVE',
      isDeleted: false,
      fullName: { $regex: namePattern },
    });

    if (existingInOtherFlat) {
      throw new ConflictError(
        `Resident '${trimmedName}' is already active in another flat. Use the reassignment workflow to move them.`
      );
    }

    // 5. Create the resident record
    const resident = await Resident.create({
      fullName: input.fullName.trim(),
      email: input.email || null,
      phone: input.phone || null,
      flatId: flat._id,
      residentCategory: input.residentCategory,
      isOccupant: input.isOccupant ?? false,
      relationshipToPrimaryResident: input.relationshipToPrimaryResident || null,
      residencyStatus: 'ACTIVE',
      moveInDate: input.moveInDate || null,
      moveOutDate: null,
      userId: null,
    });

    // 6. Synchronize flat occupancy based on active occupants
    await this.syncFlatOccupancy(flat._id.toString());

    return await this.populateResident(resident);
  }

  /**
   * Update allow-listed fields on an existing resident.
   * Re-syncs flat occupancy if occupancy-relevant fields change.
   */
  async updateResident(id: string, input: UpdateResidentInput): Promise<IResident> {
    const resident = await this.getResidentRaw(id);

    let occupancyRelevant = false;

    if (input.fullName !== undefined) {
      resident.fullName = input.fullName.trim();
    }
    if (input.email !== undefined) {
      resident.email = input.email || null;
    }
    if (input.phone !== undefined) {
      resident.phone = input.phone || null;
    }
    if (input.residentCategory !== undefined) {
      resident.residentCategory = input.residentCategory;
      occupancyRelevant = true;
    }
    if (input.isOccupant !== undefined) {
      resident.isOccupant = input.isOccupant;
      occupancyRelevant = true;
    }
    if (input.relationshipToPrimaryResident !== undefined) {
      resident.relationshipToPrimaryResident = input.relationshipToPrimaryResident || null;
    }
    if (input.moveInDate !== undefined) {
      resident.moveInDate = input.moveInDate;
    }

    await resident.save();

    if (occupancyRelevant) {
      await this.syncFlatOccupancy(resident.flatId.toString());
    }

    return await this.populateResident(resident);
  }

  /**
   * End an active residency — sets status to INACTIVE and records the move-out date.
   * Synchronizes flat occupancy after the change.
   */
  async moveOut(id: string, input: MoveOutInput): Promise<IResident> {
    const resident = await this.getResidentRaw(id);

    if (resident.residencyStatus !== 'ACTIVE') {
      throw new BadRequestError('This resident is already inactive (moved out).');
    }

    resident.residencyStatus = 'INACTIVE';
    resident.moveOutDate = input.moveOutDate || new Date();
    await resident.save();

    await this.syncFlatOccupancy(resident.flatId.toString());

    return await this.populateResident(resident);
  }

  /**
   * Reassign a resident to a new flat.
   *
   * Preserves history by marking the current record as INACTIVE with a move-out
   * date, then creating a new ACTIVE record linked to the target flat. Both flats
   * have their occupancy re-synchronized.
   */
  async reassign(id: string, input: ReassignInput): Promise<IResident> {
    const currentResident = await this.getResidentRaw(id);

    if (currentResident.residencyStatus !== 'ACTIVE') {
      throw new BadRequestError('Only active residents can be reassigned.');
    }

    // Verify the new flat exists and is active
    const newFlat = await Flat.findOne({ _id: input.newFlatId, isDeleted: false });
    if (!newFlat) {
      throw new NotFoundError('Target flat does not exist.');
    }

    if (newFlat._id.toString() === currentResident.flatId.toString()) {
      throw new BadRequestError('The target flat is the same as the current flat.');
    }

    const oldFlatId = currentResident.flatId.toString();
    const moveOutDate = input.moveOutDate || new Date();

    // 1. End the current residency (preserve history)
    currentResident.residencyStatus = 'INACTIVE';
    currentResident.moveOutDate = moveOutDate;
    await currentResident.save();

    // 2. Create a new active residency record in the target flat
    const newResident = await Resident.create({
      fullName: currentResident.fullName,
      email: currentResident.email,
      phone: currentResident.phone,
      flatId: newFlat._id,
      residentCategory: currentResident.residentCategory,
      isOccupant: currentResident.isOccupant,
      relationshipToPrimaryResident: currentResident.relationshipToPrimaryResident,
      residencyStatus: 'ACTIVE',
      moveInDate: input.moveInDate || moveOutDate,
      moveOutDate: null,
      userId: currentResident.userId || null,
    });

    // 3. Synchronize occupancy for both flats
    await this.syncFlatOccupancy(oldFlatId);
    await this.syncFlatOccupancy(newFlat._id.toString());

    return await this.populateResident(newResident);
  }

  /**
   * Soft-delete a resident record (archive). Re-syncs flat occupancy.
   */
  async deleteResident(id: string): Promise<void> {
    const resident = await this.getResidentRaw(id);
    const flatId = resident.flatId.toString();

    resident.isDeleted = true;
    resident.deletedAt = new Date();
    await resident.save();

    await this.syncFlatOccupancy(flatId);
  }
}

export const residentService = new ResidentService();
