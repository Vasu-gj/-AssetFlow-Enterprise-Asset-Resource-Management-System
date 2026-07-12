import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    trim: true,
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'date'],
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const assetCategorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  customFields: [customFieldSchema],
}, {
  timestamps: true,
});

// Category name must be unique within same tenant
assetCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
export default AssetCategory;
