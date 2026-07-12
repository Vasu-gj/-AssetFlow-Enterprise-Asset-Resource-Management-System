import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
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
  holderType: {
    type: String,
    enum: ['Employee', 'Department'],
    required: true,
  },
  holderUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  holderDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  allocatedDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expectedReturnDate: {
    type: Date,
    default: null,
  },
  actualReturnDate: {
    type: Date,
    default: null,
  },
  conditionCheckInNotes: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue'],
    default: 'Active',
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for active allocation lookups and status reporting
allocationSchema.index({ tenantId: 1, asset: 1, status: 1 });
allocationSchema.index({ tenantId: 1, holderUser: 1, status: 1 });
allocationSchema.index({ tenantId: 1, holderDepartment: 1, status: 1 });

const Allocation = mongoose.model('Allocation', allocationSchema);
export default Allocation;
