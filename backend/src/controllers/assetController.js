import Asset from '../models/Asset.js';
import AssetCategory from '../models/AssetCategory.js';
import Department from '../models/Department.js';
import Allocation from '../models/Allocation.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import AppError from '../utils/AppError.js';
import { generateAssetTag } from '../utils/assetTagGenerator.js';
import { logActivity } from '../utils/activityLogger.js';

export const createAsset = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = req.body;

    // Verify Category exists
    const category = await AssetCategory.findOne({ tenantId, _id: data.category });
    if (!category) {
      return next(new AppError('Asset category not found.', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Verify Department exists if provided
    if (data.department) {
      const dept = await Department.findOne({ tenantId, _id: data.department });
      if (!dept) {
        return next(new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND'));
      }
    }

    // Check serialNumber duplicate within same tenant
    const serialDuplicate = await Asset.findOne({ tenantId, serialNumber: data.serialNumber });
    if (serialDuplicate) {
      return next(new AppError('Serial number already registered under this tenant.', 409, 'SERIAL_ALREADY_IN_USE'));
    }

    // Generate unique sequential tag atomically
    const assetTag = await generateAssetTag(tenantId);

    const asset = new Asset({
      tenantId,
      assetTag,
      ...data,
      status: 'Available',
    });

    await asset.save();

    // Log Activity
    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'ASSET_CREATED',
      entityType: 'Asset',
      entityId: asset._id,
      afterState: asset.toObject(),
    });

    res.status(201).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { category, status, location, department, search, isSharedBookable, page = 1, limit = 20 } = req.query;

    const filter = { tenantId };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = location;
    if (department) filter.department = department;
    if (isSharedBookable !== undefined) filter.isSharedBookable = isSharedBookable === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skipIndex = (page - 1) * limit;

    const assets = await Asset.find(filter)
      .populate('category', 'name')
      .populate('department', 'name')
      .skip(skipIndex)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Asset.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: assets,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const asset = await Asset.findOne({ tenantId, _id: req.params.id })
      .populate('category', 'name')
      .populate('department', 'name');

    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const assetId = req.params.id;
    const data = req.body;

    const asset = await Asset.findOne({ tenantId, _id: assetId });
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    if (data.category) {
      const category = await AssetCategory.findOne({ tenantId, _id: data.category });
      if (!category) {
        return next(new AppError('Asset category not found.', 404, 'CATEGORY_NOT_FOUND'));
      }
    }

    if (data.department) {
      const dept = await Department.findOne({ tenantId, _id: data.department });
      if (!dept) {
        return next(new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND'));
      }
    }

    if (data.serialNumber && data.serialNumber !== asset.serialNumber) {
      const serialDuplicate = await Asset.findOne({ tenantId, serialNumber: data.serialNumber });
      if (serialDuplicate) {
        return next(new AppError('Serial number already registered under this tenant.', 409, 'SERIAL_ALREADY_IN_USE'));
      }
    }

    const beforeState = asset.toObject();

    // Map body keys
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        asset[key] = data[key];
      }
    });

    await asset.save();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'ASSET_UPDATED',
      entityType: 'Asset',
      entityId: asset._id,
      beforeState,
      afterState: asset.toObject(),
    });

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetHistory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const assetId = req.params.id;

    const allocations = await Allocation.find({ tenantId, asset: assetId })
      .populate('holderUser', 'name email')
      .populate('holderDepartment', 'name')
      .populate('allocatedBy', 'name')
      .sort({ allocatedDate: -1 });

    const maintenance = await MaintenanceRequest.find({ tenantId, asset: assetId })
      .populate('raisedBy', 'name')
      .populate('technician', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        allocations,
        maintenance,
      },
    });
  } catch (error) {
    next(error);
  }
};
