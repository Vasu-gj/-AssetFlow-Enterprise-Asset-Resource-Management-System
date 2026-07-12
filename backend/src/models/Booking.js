import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming',
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for verifying overlaps within a specific tenant
bookingSchema.index({ tenantId: 1, asset: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ tenantId: 1, bookedBy: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
