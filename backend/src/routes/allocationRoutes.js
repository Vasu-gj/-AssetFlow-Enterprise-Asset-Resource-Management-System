import express from 'express';
import {
  allocateAsset,
  returnAsset,
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
  getAllocations,
  getTransferRequests,
} from '../controllers/allocationController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { allocateSchema, returnSchema, transferRequestSchema, transferDecisionSchema } from '../validators/allocation.js';

const router = express.Router();

router.use(auth);

// Allocations
router.get('/', getAllocations);
router.post('/', requireRole(['Admin', 'AssetManager', 'DepartmentHead']), validate(allocateSchema), allocateAsset);
router.post('/:id/return', validate(returnSchema), returnAsset);

// Transfers
router.get('/transfer-requests', getTransferRequests);
router.post('/transfer-requests', validate(transferRequestSchema), createTransferRequest);
router.patch('/transfer-requests/:id/approve', requireRole(['Admin', 'AssetManager', 'DepartmentHead']), validate(transferDecisionSchema), approveTransfer);
router.patch('/transfer-requests/:id/reject', requireRole(['Admin', 'AssetManager', 'DepartmentHead']), validate(transferDecisionSchema), rejectTransfer);

export default router;
