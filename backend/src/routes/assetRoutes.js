import express from 'express';
import { createAsset, getAssets, getAssetById, updateAsset, getAssetHistory } from '../controllers/assetController.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { assetCreateSchema, assetUpdateSchema } from '../validators/asset.js';

const router = express.Router();

router.use(auth);

router.get('/', getAssets);
router.get('/:id', getAssetById);
router.get('/:id/history', getAssetHistory);

router.post('/', requireRole(['Admin', 'AssetManager']), validate(assetCreateSchema), createAsset);
router.put('/:id', requireRole(['Admin', 'AssetManager']), validate(assetUpdateSchema), updateAsset);

export default router;
