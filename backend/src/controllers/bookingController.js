import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Asset from '../models/Asset.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notificationService.js';

export const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const { assetId, startTime, endTime, purpose } = req.body;

    if (new Date(startTime) >= new Date(endTime)) {
      return next(new AppError('End time must be after start time.', 400));
    }

    if (new Date(startTime) < new Date()) {
      return next(new AppError('Cannot book resources in the past.', 400));
    }

    // Verify asset exists and is shared bookable
    const asset = await Asset.findOne({ tenantId, _id: assetId }).session(session);
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    if (!asset.isSharedBookable) {
      return next(new AppError('This asset is not registered as a shared bookable resource.', 409, 'ASSET_NOT_BOOKABLE'));
    }

    // Enforce overlapping validation
    const overlap = await Booking.findOne({
      tenantId,
      asset: assetId,
      status: { $in: ['Upcoming', 'Ongoing'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    }).session(session);

    if (overlap) {
      return next(new AppError('Time slot conflict: The resource is already booked during this period.', 409, 'BOOKING_CONFLICT'));
    }

    const booking = new Booking({
      tenantId,
      asset: assetId,
      bookedBy: req.user.id,
      department: req.user.departmentId || null,
      startTime,
      endTime,
      purpose,
      status: 'Upcoming',
    });

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'RESOURCE_BOOKED',
      entityType: 'Asset',
      entityId: assetId,
      afterState: booking.toObject(),
    });

    await createNotification({
      tenantId,
      userId: req.user.id,
      type: 'BOOKING_CONFIRMED',
      message: `Your booking for ${asset.name} on ${new Date(startTime).toLocaleString()} is confirmed.`,
      entityType: 'Booking',
      entityId: booking._id,
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { asset, from, to } = req.query;

    const filter = { tenantId };
    if (asset) filter.asset = asset;
    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = new Date(from);
      if (to) filter.startTime.$lte = new Date(to);
    }

    const bookings = await Booking.find(filter)
      .populate('asset', 'name assetTag')
      .populate('bookedBy', 'name email')
      .populate('department', 'name')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const bookingId = req.params.id;

    const booking = await Booking.findOne({ tenantId, _id: bookingId });
    if (!booking) {
      return next(new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND'));
    }

    // Verify cancellation rights (booker or manager/admin)
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'AssetManager' && req.user.role !== 'Admin') {
      return next(new AppError('Unauthorized to cancel this booking.', 403, 'FORBIDDEN'));
    }

    // Only cancel if Upcoming
    if (booking.status !== 'Upcoming') {
      return next(new AppError(`Cannot cancel booking. Current status is ${booking.status}.`, 409, 'BOOKING_ALREADY_STARTED'));
    }

    booking.status = 'Cancelled';
    await booking.save();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: bookingId,
      afterState: booking.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
