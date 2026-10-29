import { z } from 'zod';

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createResidentSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Phone number cannot exceed 20 characters').optional().or(z.literal('')),
  flatId: z
    .string({ required_error: 'Flat reference is required' })
    .regex(objectIdRegex, 'Invalid flat ID format'),
  residentCategory: z.enum(['OWNER', 'TENANT', 'FAMILY_MEMBER']),
  isOccupant: z.boolean().optional().default(false),
  relationshipToPrimaryResident: z.string().trim().max(50).optional().or(z.literal('')),
  moveInDate: z.coerce.date().optional(),
});

export const updateResidentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional(),
  email: z.string().email('Invalid email address format').optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(20, 'Phone number cannot exceed 20 characters').optional().nullable().or(z.literal('')),
  residentCategory: z.enum(['OWNER', 'TENANT', 'FAMILY_MEMBER']).optional(),
  isOccupant: z.boolean().optional(),
  relationshipToPrimaryResident: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  moveInDate: z.coerce.date().optional(),
  // userId is intentionally NOT included — account linking is a separate
  // authorized operation, never mass-assigned from arbitrary request bodies.
});

export const moveOutSchema = z.object({
  moveOutDate: z.coerce.date().optional(),
});

export const reassignSchema = z.object({
  newFlatId: z
    .string({ required_error: 'New flat reference is required' })
    .regex(objectIdRegex, 'Invalid flat ID format'),
  moveOutDate: z.coerce.date().optional(),
  moveInDate: z.coerce.date().optional(),
});

export const residentParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid resident ID format'),
});

export const flatParamsSchema = z.object({
  flatId: z.string().regex(objectIdRegex, 'Invalid flat ID format'),
});

export const residentQuerySchema = z.object({
  flatId: z.string().regex(objectIdRegex, 'Invalid flat ID').optional(),
  buildingId: z.string().regex(objectIdRegex, 'Invalid building ID').optional(),
  category: z.enum(['OWNER', 'TENANT', 'FAMILY_MEMBER']).optional(),
  residencyStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  isOccupant: z.enum(['true', 'false']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
export type MoveOutInput = z.infer<typeof moveOutSchema>;
export type ReassignInput = z.infer<typeof reassignSchema>;
export type ResidentQueryInput = z.infer<typeof residentQuerySchema>;
