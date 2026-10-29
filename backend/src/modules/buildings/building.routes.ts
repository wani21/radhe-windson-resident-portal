import { Router } from 'express';
import { buildingController } from './building.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  createBuildingSchema,
  updateBuildingSchema,
  buildingParamsSchema,
} from './building.schema';

const router = Router();

// GET /api/v1/buildings - All authenticated users can list buildings
router.get('/', authenticate, buildingController.getAllBuildings);

// GET /api/v1/buildings/:id - All authenticated users can view a building
router.get(
  '/:id',
  authenticate,
  validateRequest({ params: buildingParamsSchema }),
  buildingController.getBuildingById
);

// POST /api/v1/buildings - Restricted to SOCIETY_ADMIN
router.post(
  '/',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ body: createBuildingSchema }),
  buildingController.createBuilding
);

// PATCH /api/v1/buildings/:id - Restricted to SOCIETY_ADMIN
router.patch(
  '/:id',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: buildingParamsSchema, body: updateBuildingSchema }),
  buildingController.updateBuilding
);

// DELETE /api/v1/buildings/:id - Restricted to SOCIETY_ADMIN
router.delete(
  '/:id',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ params: buildingParamsSchema }),
  buildingController.deleteBuilding
);

export const buildingRoutes = router;
