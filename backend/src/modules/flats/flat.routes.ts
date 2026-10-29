import { Router } from 'express';
import { flatController } from './flat.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  createFlatSchema,
  updateFlatSchema,
  flatParamsSchema,
  flatQuerySchema,
} from './flat.schema';

const router = Router();

// GET /api/v1/flats - All authenticated users can query the flat directory
router.get(
  '/',
  authenticate,
  validateRequest({ query: flatQuerySchema }),
  flatController.getFlats
);

// GET /api/v1/flats/:id - All authenticated users can view flat details
router.get(
  '/:id',
  authenticate,
  validateRequest({ params: flatParamsSchema }),
  flatController.getFlatById
);

// POST /api/v1/flats - Restricted to SOCIETY_ADMIN
router.post(
  '/',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ body: createFlatSchema }),
  flatController.createFlat
);

// PATCH /api/v1/flats/:id - Restricted to SOCIETY_ADMIN
router.patch(
  '/:id',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: flatParamsSchema, body: updateFlatSchema }),
  flatController.updateFlat
);

// DELETE /api/v1/flats/:id - Restricted to SOCIETY_ADMIN
router.delete(
  '/:id',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: flatParamsSchema }),
  flatController.deleteFlat
);

export const flatRoutes = router;
