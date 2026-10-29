import { z } from 'zod';

export const societyAddressSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
});

export const societySettingsSchema = z.object({
  maintenanceDueDay: z
    .number({ invalid_type_error: 'Maintenance due day must be a number' })
    .int('Maintenance due day must be an integer')
    .min(1, 'Maintenance due day must be between 1 and 28')
    .max(28, 'Maintenance due day must be between 1 and 28')
    .optional(),
  lateFee: z
    .number({ invalid_type_error: 'Late fee must be a number' })
    .min(0, 'Late fee cannot be negative')
    .optional(),
});

export const createSocietySchema = z.object({
  name: z
    .string({ required_error: 'Society name is required' })
    .trim()
    .min(2, 'Society name must be at least 2 characters')
    .max(150, 'Society name cannot exceed 150 characters'),
  registrationNumber: z.string().trim().optional(),
  address: societyAddressSchema.optional(),
  contactEmail: z.string().email('Invalid email address format').optional().or(z.literal('')),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  settings: societySettingsSchema.optional(),
});

export const updateSocietySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Society name must be at least 2 characters')
    .max(150, 'Society name cannot exceed 150 characters')
    .optional(),
  registrationNumber: z.string().trim().optional().nullable(),
  address: societyAddressSchema.optional(),
  contactEmail: z.string().email('Invalid email address format').optional().nullable().or(z.literal('')),
  contactPhone: z.string().trim().optional().nullable().or(z.literal('')),
  settings: societySettingsSchema.optional(),
});

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;
export type UpdateSocietyInput = z.infer<typeof updateSocietySchema>;
