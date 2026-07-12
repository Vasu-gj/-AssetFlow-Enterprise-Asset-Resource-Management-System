import mongoose from 'mongoose';

const auditAssetEntrySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  auditCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditCycle',
    required: true,
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  result: {
    type: String,
    enum: ['Verified', 'Missing', 'Damaged'],
    required: true,
  },
  notes: {
    type: String,
    default: null,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// An asset should only have one entry per audit cycle
auditAssetEntrySchema.index({ tenantId: 1, auditCycle: 1, asset: 1 }, { unique: true });

const AuditAssetEntry = mongoose.model('AuditAssetEntry', auditAssetEntrySchema);
export default AuditAssetEntry;
