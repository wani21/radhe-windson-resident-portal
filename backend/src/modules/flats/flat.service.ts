import { Flat, IFlat } from '../../models/flat.model';
import { Building } from '../../models/building.model';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { CreateFlatInput, UpdateFlatInput, FlatQueryInput } from './flat.schema';

export class FlatService {
  async getFlats(query: FlatQueryInput): Promise<{ flats: IFlat[]; meta: any }> {
    const filter: any = { isDeleted: false };

    if (query.buildingId) {
      filter.buildingId = query.buildingId;
    }

    if (query.floor !== undefined) {
      filter.floor = query.floor;
    }

    if (query.occupancyStatus) {
      filter.occupancyStatus = query.occupancyStatus;
    }

    if (query.search) {
      filter.flatNumber = { $regex: query.search.trim(), $options: 'i' };
    }

    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const [flats, total] = await Promise.all([
      Flat.find(filter)
        .populate('buildingId', 'name totalFloors')
        .sort({ flatNumber: 1 })
        .skip(skip)
        .limit(limit),
      Flat.countDocuments(filter),
    ]);

    return {
      flats,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getFlatById(id: string): Promise<IFlat> {
    const flat = await Flat.findOne({ _id: id, isDeleted: false }).populate(
      'buildingId',
      'name totalFloors'
    );
    if (!flat) {
      throw new NotFoundError(`Flat with ID ${id} not found.`);
    }
    return flat;
  }

  async createFlat(input: CreateFlatInput): Promise<IFlat> {
    // 1. Verify building exists and is active
    const building = await Building.findOne({ _id: input.buildingId, isDeleted: false });
    if (!building) {
      throw new NotFoundError('Associated building does not exist.');
    }

    // 2. Validate floor does not exceed building's total floors
    if (input.floor > building.totalFloors) {
      throw new BadRequestError(
        `Floor ${input.floor} exceeds the total floors (${building.totalFloors}) configured for ${building.name}.`
      );
    }

    // 3. Normalized flat number
    const normalizedNumber = input.flatNumber.trim().toUpperCase();

    // 4. Pre-check for duplicate flat in the same building
    const existing = await Flat.findOne({
      buildingId: input.buildingId,
      flatNumber: normalizedNumber,
      isDeleted: false,
    });

    if (existing) {
      throw new ConflictError(
        `Flat '${normalizedNumber}' already exists in ${building.name}. Duplicate flat numbers are not permitted in the same building.`
      );
    }

    try {
      const flat = await Flat.create({
        buildingId: input.buildingId,
        flatNumber: normalizedNumber,
        floor: input.floor,
        occupancyStatus: input.occupancyStatus || 'VACANT',
      });
      return await flat.populate('buildingId', 'name totalFloors');
    } catch (err: any) {
      // Catch MongoDB unique index E11000 collision on { buildingId: 1, flatNumber: 1 }
      if (err.code === 11000) {
        throw new ConflictError(
          `Flat '${normalizedNumber}' already exists in this building. Duplicate flat numbers are not permitted.`
        );
      }
      throw err;
    }
  }

  async updateFlat(id: string, input: UpdateFlatInput): Promise<IFlat> {
    const flat = await this.getFlatById(id);
    const building = await Building.findById(flat.buildingId);

    if (!building || building.isDeleted) {
      throw new NotFoundError('Associated building no longer exists.');
    }

    // Validate floor if changed
    if (input.floor !== undefined) {
      if (input.floor > building.totalFloors) {
        throw new BadRequestError(
          `Floor ${input.floor} exceeds the total floors (${building.totalFloors}) configured for ${building.name}.`
        );
      }
      flat.floor = input.floor;
    }

    // Validate and check duplicate if flatNumber changed
    if (input.flatNumber) {
      const normalizedNumber = input.flatNumber.trim().toUpperCase();
      if (normalizedNumber !== flat.flatNumber) {
        const existing = await Flat.findOne({
          _id: { $ne: flat._id },
          buildingId: flat.buildingId,
          flatNumber: normalizedNumber,
          isDeleted: false,
        });

        if (existing) {
          throw new ConflictError(
            `Another flat '${normalizedNumber}' already exists in ${building.name}.`
          );
        }
        flat.flatNumber = normalizedNumber;
      }
    }

    if (input.occupancyStatus) {
      flat.occupancyStatus = input.occupancyStatus;
    }

    await flat.save();
    return await flat.populate('buildingId', 'name totalFloors');
  }

  async deleteFlat(id: string): Promise<void> {
    const flat = await this.getFlatById(id);
    flat.isDeleted = true;
    flat.deletedAt = new Date();
    await flat.save();
  }
}

export const flatService = new FlatService();
