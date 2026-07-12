import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetEntity: {
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  beforeState: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  afterState: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Activity logs are append-only. Only read indexes are needed.
activityLogSchema.index({ tenantId: 1, timestamp: -1 });
activityLogSchema.index({ tenantId: 1, actor: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
