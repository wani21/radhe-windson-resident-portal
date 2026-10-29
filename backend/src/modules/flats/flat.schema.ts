import { z } from 'zod';

export const createFlatSchema = z.object({
  buildingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID format'),
  flatNumber: z
    .string({ required_error: 'Flat number is required' })
    .trim()
    .min(1, 'Flat number cannot be empty')
    .max(20, 'Flat number cannot exceed 20 characters')
    .transform((val) => val.toUpperCase()),
  floor: z
    .number({ required_error: 'Floor number is required' })
    .int('Floor must be an integer')
    .min(0, 'Floor cannot be negative'),
  occupancyStatus: z.enum(['VACANT', 'OCCUPIED', 'TENANTED']).optional().default('VACANT'),
});

export const updateFlatSchema = z.object({
  flatNumber: z
    .string()
    .trim()
    .min(1, 'Flat number cannot be empty')
    .max(20, 'Flat number cannot exceed 20 characters')
    .transform((val) => val.toUpperCase())
    .optional(),
  floor: z
    .number()
    .int('Floor must be an integer')
    .min(0, 'Floor cannot be negative')
    .optional(),
  occupancyStatus: z.enum(['VACANT', 'OCCUPIED', 'TENANTED']).optional(),
});

export const flatParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid flat ID format'),
});

export const flatQuerySchema = z.object({
  buildingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID').optional(),
  floor: z.coerce.number().int().optional(),
  occupancyStatus: z.enum(['VACANT', 'OCCUPIED', 'TENANTED']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateFlatInput = z.infer<typeof createFlatSchema>;
export type UpdateFlatInput = z.infer<typeof updateFlatSchema>;
export type FlatQueryInput = z.infer<typeof flatQuerySchema>;
