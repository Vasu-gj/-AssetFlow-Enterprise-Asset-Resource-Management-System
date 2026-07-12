import mongoose from 'mongoose';

const transferRequestSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  fromAllocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allocation',
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedForUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  requestedForDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Requested',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  decisionNotes: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

transferRequestSchema.index({ tenantId: 1, asset: 1, status: 1 });
transferRequestSchema.index({ tenantId: 1, requestedBy: 1 });

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
export default TransferRequest;
