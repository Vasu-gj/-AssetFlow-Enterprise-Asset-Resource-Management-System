import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
