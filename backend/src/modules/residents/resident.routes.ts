import { Router } from 'express';
import { residentController } from './resident.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  createResidentSchema,
  updateResidentSchema,
  moveOutSchema,
  reassignSchema,
  residentParamsSchema,
  flatParamsSchema,
  residentQuerySchema,
} from './resident.schema';

const router = Router();

// GET /api/v1/residents - All authenticated users can view the directory
router.get(
  '/',
  authenticate,
  validateRequest({ query: residentQuerySchema }),
  residentController.getResidents
);

// GET /api/v1/residents/:id - All authenticated users can view a resident
router.get(
  '/:id',
  authenticate,
  validateRequest({ params: residentParamsSchema }),
  residentController.getResidentById
);

// POST /api/v1/residents - Restricted to SOCIETY_ADMIN
router.post(
  '/',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ body: createResidentSchema }),
  residentController.createResident
);

// PATCH /api/v1/residents/:id - Restricted to SOCIETY_ADMIN
router.patch(
  '/:id',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: residentParamsSchema, body: updateResidentSchema }),
  residentController.updateResident
);

// POST /api/v1/residents/:id/move-out - Restricted to SOCIETY_ADMIN
router.post(
  '/:id/move-out',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: residentParamsSchema, body: moveOutSchema }),
  residentController.moveOut
);

// POST /api/v1/residents/:id/reassign - Restricted to SOCIETY_ADMIN
router.post(
  '/:id/reassign',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: residentParamsSchema, body: reassignSchema }),
  residentController.reassign
);

// DELETE /api/v1/residents/:id - Restricted to SOCIETY_ADMIN
router.delete(
  '/:id',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: residentParamsSchema }),
  residentController.deleteResident
);

// GET /api/v1/flats/:flatId/residents - All authenticated users can view flat occupants
// This is mounted under /flats in app.ts, not under /residents
export const flatResidentsRoutes = Router();

flatResidentsRoutes.get(
  '/:flatId/residents',
  authenticate,
  validateRequest({ params: flatParamsSchema }),
  residentController.getResidentsByFlat
);

export const residentRoutes = router;
