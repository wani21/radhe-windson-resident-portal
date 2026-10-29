import { Router } from 'express';
import { societyController } from './society.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createSocietySchema, updateSocietySchema } from './society.schema';

const router = Router();

// GET /api/v1/society - Any authenticated user can view society info
router.get('/', authenticate, societyController.getSociety);

// POST /api/v1/society - Restricted to SOCIETY_ADMIN, single-society enforcement
router.post(
  '/',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ body: createSocietySchema }),
  societyController.createSociety
);

// PATCH /api/v1/society - Restricted to SOCIETY_ADMIN
router.patch(
  '/',
  authenticate,
  requireRole('SOCIETY_ADMIN'),
  validateRequest({ body: updateSocietySchema }),
  societyController.updateSociety
);

export const societyRoutes = router;
