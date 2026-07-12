import AssetCategory from '../models/AssetCategory.js';
import Asset from '../models/Asset.js';
import AppError from '../utils/AppError.js';

export const createCategory = async (req, res, next) => {
  try {
    const { name, customFields } = req.body;
    const tenantId = req.user.tenantId;

    const category = new AssetCategory({
      tenantId,
      name,
      customFields: customFields || [],
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const categories = await AssetCategory.find({ tenantId });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const category = await AssetCategory.findOne({ tenantId, _id: req.params.id });

    if (!category) {
      return next(new AppError('Asset category not found.', 404, 'CATEGORY_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, customFields } = req.body;
    const tenantId = req.user.tenantId;
    const categoryId = req.params.id;

    const category = await AssetCategory.findOne({ tenantId, _id: categoryId });
    if (!category) {
      return next(new AppError('Asset category not found.', 404, 'CATEGORY_NOT_FOUND'));
    }

    category.name = name || category.name;
    if (customFields !== undefined) {
      category.customFields = customFields;
    }

    await category.save();

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const categoryId = req.params.id;

    // Check if any asset is associated with this category
    const assetExists = await Asset.findOne({ tenantId, category: categoryId });
    if (assetExists) {
      return next(new AppError('Cannot delete category because active assets are assigned to it.', 409, 'DEPENDENCY_EXISTS'));
    }

    const deleted = await AssetCategory.findOneAndDelete({ tenantId, _id: categoryId });
    if (!deleted) {
      return next(new AppError('Asset category not found.', 404, 'CATEGORY_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'Asset category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
