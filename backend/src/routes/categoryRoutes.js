import express from 'express';
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { categorySchema } from '../validators/organization.js';

const router = express.Router();

router.use(auth);

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.post('/', requireRole(['Admin']), validate(categorySchema), createCategory);
router.put('/:id', requireRole(['Admin']), validate(categorySchema), updateCategory);
router.delete('/:id', requireRole(['Admin']), deleteCategory);

export default router;
