import { z } from 'zod';

export const createBuildingSchema = z.object({
  name: z
    .string({ required_error: 'Building name is required' })
    .trim()
    .min(1, 'Building name cannot be empty')
    .max(50, 'Building name cannot exceed 50 characters'),
  totalFloors: z
    .number({ required_error: 'Total floors is required' })
    .int('Total floors must be an integer')
    .min(1, 'Building must have at least 1 floor')
    .max(100, 'Total floors cannot exceed 100'),
});

export const updateBuildingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Building name cannot be empty')
    .max(50, 'Building name cannot exceed 50 characters')
    .optional(),
  totalFloors: z
    .number()
    .int('Total floors must be an integer')
    .min(1, 'Building must have at least 1 floor')
    .max(100, 'Total floors cannot exceed 100')
    .optional(),
});

export const buildingParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID format'),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
