import mongoose from 'mongoose';

const auditCycleSchema = new mongoose.Schema({
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
  scopeDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  scopeLocation: {
    type: String,
    default: null,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  auditors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'],
    default: 'Open',
  },
  inScopeAssets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
  }],
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  closedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

auditCycleSchema.index({ tenantId: 1, status: 1 });

const AuditCycle = mongoose.model('AuditCycle', auditCycleSchema);
export default AuditCycle;
