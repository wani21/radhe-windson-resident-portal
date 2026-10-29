import { Building, IBuilding } from '../../models/building.model';
import { Flat } from '../../models/flat.model';
import { societyService } from '../society/society.service';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { CreateBuildingInput, UpdateBuildingInput } from './building.schema';

/**
 * Escapes RegExp special characters so a user-supplied string is matched
 * literally in a case-insensitive uniqueness check. Without this, names
 * containing characters like "(", ".", or "[" would either throw a
 * SyntaxError (500) or produce false-positive matches.
 */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class BuildingService {
  async getAllBuildings(): Promise<IBuilding[]> {
    return Building.find({ isDeleted: false }).sort({ name: 1 });
  }

  async getBuildingById(id: string): Promise<IBuilding> {
    const building = await Building.findOne({ _id: id, isDeleted: false });
    if (!building) {
      throw new NotFoundError(`Building with ID ${id} not found.`);
    }
    return building;
  }

  async createBuilding(input: CreateBuildingInput): Promise<IBuilding> {
    const society = await societyService.getSociety();

    // Check duplicate building name in society (case-insensitive, regex-safe)
    const duplicate = await Building.findOne({
      societyId: society._id,
      name: { $regex: new RegExp(`^${escapeRegExp(input.name.trim())}$`, 'i') },
      isDeleted: false,
    });

    if (duplicate) {
      throw new ConflictError(`A building or wing named '${input.name}' already exists.`);
    }

    return Building.create({
      societyId: society._id,
      name: input.name.trim(),
      totalFloors: input.totalFloors,
    });
  }

  async updateBuilding(id: string, input: UpdateBuildingInput): Promise<IBuilding> {
    const building = await this.getBuildingById(id);

    // If changing name, ensure uniqueness
    if (input.name && input.name.trim().toLowerCase() !== building.name.toLowerCase()) {
      const duplicate = await Building.findOne({
        societyId: building.societyId,
        _id: { $ne: building._id },
        name: { $regex: new RegExp(`^${escapeRegExp(input.name.trim())}$`, 'i') },
        isDeleted: false,
      });

      if (duplicate) {
        throw new ConflictError(`Another building named '${input.name}' already exists.`);
      }
      building.name = input.name.trim();
    }

    // If reducing totalFloors, assert no existing flats exceed the new floor count
    if (input.totalFloors !== undefined && input.totalFloors < building.totalFloors) {
      const highestFlat = await Flat.findOne({
        buildingId: building._id,
        isDeleted: false,
        floor: { $gt: input.totalFloors },
      }).sort({ floor: -1 });

      if (highestFlat) {
        throw new BadRequestError(
          `Cannot reduce total floors to ${input.totalFloors}. Flat ${highestFlat.flatNumber} exists on floor ${highestFlat.floor}.`
        );
      }
      building.totalFloors = input.totalFloors;
    } else if (input.totalFloors !== undefined) {
      building.totalFloors = input.totalFloors;
    }

    await building.save();
    return building;
  }

  async deleteBuilding(id: string): Promise<void> {
    const building = await this.getBuildingById(id);

    // Guard against deleting buildings with active flats
    const activeFlatsCount = await Flat.countDocuments({
      buildingId: building._id,
      isDeleted: false,
    });

    if (activeFlatsCount > 0) {
      throw new BadRequestError(
        `Cannot delete building '${building.name}' because it contains ${activeFlatsCount} active flats. Remove or reassign flats first.`
      );
    }

    building.isDeleted = true;
    building.deletedAt = new Date();
    await building.save();
  }
}

export const buildingService = new BuildingService();
