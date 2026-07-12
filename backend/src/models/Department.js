import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
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
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  departmentHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

// Ensure department name is unique under same parent within the tenant
departmentSchema.index({ tenantId: 1, parentDepartment: 1, name: 1 }, { unique: true });

const Department = mongoose.model('Department', departmentSchema);
export default Department;
