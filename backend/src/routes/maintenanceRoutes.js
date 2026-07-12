import express from 'express';
import {
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  updateMaintenanceProgress,
  getMaintenanceRequests,
} from '../controllers/maintenanceController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import {
  maintenanceCreateSchema,
  maintenanceAssignSchema,
  maintenanceProgressSchema,
} from '../validators/maintenance.js';

const router = express.Router();

router.use(auth);

router.get('/', getMaintenanceRequests);
router.post('/', validate(maintenanceCreateSchema), createMaintenanceRequest);

router.patch('/:id/approve', requireRole(['Admin', 'AssetManager']), approveMaintenanceRequest);
router.patch('/:id/reject', requireRole(['Admin', 'AssetManager']), rejectMaintenanceRequest);
router.patch('/:id/assign', requireRole(['Admin', 'AssetManager']), validate(maintenanceAssignSchema), assignTechnician);
router.patch('/:id/progress', validate(maintenanceProgressSchema), updateMaintenanceProgress);

export default router;
