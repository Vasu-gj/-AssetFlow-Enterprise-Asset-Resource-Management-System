import express from 'express';
import { getEmployees, updateEmployeeRole, updateEmployeeStatus } from '../controllers/employeeController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { employeeRoleSchema, employeeStatusSchema } from '../validators/organization.js';

const router = express.Router();

router.use(auth);

router.get('/', requireRole(['Admin', 'AssetManager']), getEmployees);
router.patch('/:id/role', requireRole(['Admin']), validate(employeeRoleSchema), updateEmployeeRole);
router.patch('/:id/status', requireRole(['Admin']), validate(employeeStatusSchema), updateEmployeeStatus);

export default router;
