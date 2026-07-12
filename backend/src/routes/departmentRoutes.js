import express from 'express';
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { departmentSchema } from '../validators/organization.js';

const router = express.Router();

router.use(auth);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

router.post('/', requireRole(['Admin']), validate(departmentSchema), createDepartment);
router.put('/:id', requireRole(['Admin']), validate(departmentSchema), updateDepartment);
router.delete('/:id', requireRole(['Admin']), deleteDepartment);

export default router;
