import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  assetTag: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssetCategory',
    required: true,
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true,
  },
  acquisitionDate: {
    type: Date,
    required: true,
  },
  acquisitionCost: {
    type: Number,
    required: true,
    min: 0,
  },
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'New',
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  photos: {
    type: [String],
    default: [],
  },
  documents: {
    type: [String],
    default: [],
  },
  isSharedBookable: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Available', 'Allocated', 'Reserved', 'UnderMaintenance', 'Lost', 'Retired', 'Disposed'],
    default: 'Available',
  },
  customFieldValues: {
    type: Map,
    of: String,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for fast lookup and uniqueness per tenant
assetSchema.index({ tenantId: 1, assetTag: 1 }, { unique: true });
assetSchema.index({ tenantId: 1, serialNumber: 1 }, { unique: true });
assetSchema.index({ tenantId: 1, status: 1, category: 1, department: 1 });

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
