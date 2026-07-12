import express from 'express';
import {
  createAuditCycle,
  markAuditEntry,
  getDiscrepancyReport,
  closeAuditCycle,
  getAuditCycles,
} from '../controllers/auditController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { auditCycleCreateSchema, auditEntrySchema } from '../validators/audit.js';

const router = express.Router();

router.use(auth);

router.get('/', getAuditCycles);
router.post('/', requireRole(['Admin', 'AssetManager']), validate(auditCycleCreateSchema), createAuditCycle);

router.post('/:id/entries', validate(auditEntrySchema), markAuditEntry);
router.get('/:id/discrepancy-report', requireRole(['Admin', 'AssetManager']), getDiscrepancyReport);
router.patch('/:id/close', requireRole(['Admin', 'AssetManager']), closeAuditCycle);

export default router;
