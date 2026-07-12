import express from 'express';
import {
  getDashboardKPIs,
  getUtilizationReport,
  getMaintenanceFrequencyReport,
  getRetirementForecastReport,
  getDepartmentAllocationSummary,
  getBookingHeatmap,
} from '../controllers/reportController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = express.Router();

router.use(auth);

router.get('/dashboard/kpis', getDashboardKPIs);
router.get('/utilization', requireRole(['Admin', 'AssetManager', 'DepartmentHead']), getUtilizationReport);
router.get('/maintenance-frequency', requireRole(['Admin', 'AssetManager']), getMaintenanceFrequencyReport);
router.get('/retirement-forecast', requireRole(['Admin', 'AssetManager']), getRetirementForecastReport);
router.get('/department-allocation-summary', requireRole(['Admin', 'DepartmentHead']), getDepartmentAllocationSummary);
router.get('/booking-heatmap', requireRole(['Admin', 'AssetManager']), getBookingHeatmap);

export default router;
