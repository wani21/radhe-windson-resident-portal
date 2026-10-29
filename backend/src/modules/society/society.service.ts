import { Society, ISociety } from '../../models/society.model';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { CreateSocietyInput, UpdateSocietyInput } from './society.schema';

export class SocietyService {
  /**
   * Retrieve the primary society profile.
   * Auto-provisions the Radhe Windson profile if the database is newly initialized.
   */
  async getSociety(): Promise<ISociety> {
    let society = await Society.findOne();
    if (!society) {
      society = await Society.create({
        name: 'Radhe Windson Residential Society',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
        },
        settings: {
          maintenanceDueDay: 5,
          lateFee: 0,
        },
      });
    }
    return society;
  }

  /**
   * Create the primary society profile (Single-society constraint).
   */
  async createSociety(input: CreateSocietyInput): Promise<ISociety> {
    const existingCount = await Society.countDocuments();
    if (existingCount > 0) {
      throw new ConflictError(
        'A society configuration already exists. The application enforces a single-society architecture.'
      );
    }

    return Society.create({
      name: input.name,
      registrationNumber: input.registrationNumber || null,
      address: input.address || {},
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      settings: {
        maintenanceDueDay: input.settings?.maintenanceDueDay ?? 5,
        lateFee: input.settings?.lateFee ?? 0,
      },
    });
  }

  /**
   * Update society settings and metadata.
   */
  async updateSociety(input: UpdateSocietyInput): Promise<ISociety> {
    const society = await this.getSociety();

    if (input.name !== undefined) society.name = input.name;
    if (input.registrationNumber !== undefined) society.registrationNumber = input.registrationNumber || undefined;
    if (input.contactEmail !== undefined) society.contactEmail = input.contactEmail || undefined;
    if (input.contactPhone !== undefined) society.contactPhone = input.contactPhone || undefined;

    if (input.address) {
      society.address = {
        ...society.address,
        ...input.address,
      };
    }

    if (input.settings) {
      if (input.settings.maintenanceDueDay !== undefined) {
        society.settings.maintenanceDueDay = input.settings.maintenanceDueDay;
      }
      if (input.settings.lateFee !== undefined) {
        society.settings.lateFee = input.settings.lateFee;
      }
    }

    await society.save();
    return society;
  }
}

export const societyService = new SocietyService();
