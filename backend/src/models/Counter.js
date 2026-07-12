import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

// Ensure a single counter document per model/field in a tenant
counterSchema.index({ tenantId: 1, model: 1, field: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
