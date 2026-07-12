import mongoose from 'mongoose';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notificationService.js';

export const createMaintenanceRequest = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { assetId, issueDescription, priority, photo } = req.body;

    const asset = await Asset.findOne({ tenantId, _id: assetId });
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    if (['Lost', 'Retired', 'Disposed'].includes(asset.status)) {
      return next(new AppError(`Cannot raise maintenance request for asset in status: ${asset.status}`, 409, 'INVALID_ASSET_STATUS'));
    }

    const request = new MaintenanceRequest({
      tenantId,
      asset: assetId,
      raisedBy: req.user.id,
      issueDescription,
      priority,
      photo: photo || null,
      status: 'Pending',
      statusHistory: [{
        status: 'Pending',
        changedBy: req.user.id,
        changedAt: new Date(),
      }],
    });

    await request.save();

    // Log Activity
    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'MAINTENANCE_REQUESTED',
      entityType: 'Asset',
      entityId: assetId,
      afterState: request.toObject(),
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const approveMaintenanceRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const requestId = req.params.id;

    const request = await MaintenanceRequest.findOne({ tenantId, _id: requestId }).session(session);
    if (!request) {
      return next(new AppError('Maintenance request not found.', 404, 'REQUEST_NOT_FOUND'));
    }

    if (request.status !== 'Pending') {
      return next(new AppError('Request is already approved, rejected, or completed.', 409, 'INVALID_STATE_TRANSITION'));
    }

    // Update request
    request.status = 'Approved';
    request.approvedBy = req.user.id;
    request.statusHistory.push({
      status: 'Approved',
      changedBy: req.user.id,
      changedAt: new Date(),
    });
    await request.save({ session });

    // Revert asset status to UnderMaintenance
    const asset = await Asset.findOne({ tenantId, _id: request.asset }).session(session);
    if (asset) {
      asset.status = 'UnderMaintenance';
      await asset.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'MAINTENANCE_APPROVED',
      entityType: 'Asset',
      entityId: request.asset,
      afterState: request.toObject(),
    });

    await createNotification({
      tenantId,
      userId: request.raisedBy,
      type: 'MAINTENANCE_APPROVED',
      message: `Your maintenance request for asset has been approved.`,
      entityType: 'Asset',
      entityId: request.asset,
    });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const rejectMaintenanceRequest = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const requestId = req.params.id;
    const { rejectionReason } = req.body;

    const request = await MaintenanceRequest.findOne({ tenantId, _id: requestId });
    if (!request) {
      return next(new AppError('Maintenance request not found.', 404, 'REQUEST_NOT_FOUND'));
    }

    if (request.status !== 'Pending') {
      return next(new AppError('Request is not in Pending status.', 409, 'INVALID_STATE_TRANSITION'));
    }

    request.status = 'Rejected';
    request.rejectionReason = rejectionReason || 'No reason provided';
    request.statusHistory.push({
      status: 'Rejected',
      changedBy: req.user.id,
      changedAt: new Date(),
    });

    await request.save();

    await createNotification({
      tenantId,
      userId: request.raisedBy,
      type: 'MAINTENANCE_REJECTED',
      message: `Your maintenance request was rejected. Reason: ${rejectionReason || 'None'}`,
      entityType: 'Asset',
      entityId: request.asset,
    });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTechnician = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const requestId = req.params.id;
    const { technicianId } = req.body;

    // Verify technician user exists and has Technician role
    const technician = await User.findOne({ tenantId, _id: technicianId, role: 'Technician' });
    if (!technician) {
      return next(new AppError('Target user is not registered as a Technician.', 404, 'TECHNICIAN_NOT_FOUND'));
    }

    const request = await MaintenanceRequest.findOne({ tenantId, _id: requestId });
    if (!request) {
      return next(new AppError('Maintenance request not found.', 404, 'REQUEST_NOT_FOUND'));
    }

    if (!['Pending', 'Approved'].includes(request.status)) {
      return next(new AppError(`Cannot assign technician to a ticket in status ${request.status}.`, 409, 'INVALID_STATE_TRANSITION'));
    }

    request.status = 'TechnicianAssigned';
    request.technician = technicianId;
    request.statusHistory.push({
      status: 'TechnicianAssigned',
      changedBy: req.user.id,
      changedAt: new Date(),
    });

    await request.save();

    await createNotification({
      tenantId,
      userId: technicianId,
      type: 'TICKET_ASSIGNED',
      message: `A new maintenance ticket has been assigned to you.`,
      entityType: 'Asset',
      entityId: request.asset,
    });

    res.status(200).json({
      success: true,
      message: 'Technician assigned successfully.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceProgress = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const requestId = req.params.id;
    const { status } = req.body;

    const request = await MaintenanceRequest.findOne({ tenantId, _id: requestId }).session(session);
    if (!request) {
      return next(new AppError('Maintenance request not found.', 404, 'REQUEST_NOT_FOUND'));
    }

    // Verify authority: assigned technician or manager/admin
    if (request.technician?.toString() !== req.user.id && req.user.role !== 'AssetManager' && req.user.role !== 'Admin') {
      return next(new AppError('Unauthorized to update progress on this ticket.', 403, 'FORBIDDEN'));
    }

    if (!['TechnicianAssigned', 'InProgress'].includes(request.status)) {
      return next(new AppError('Ticket status must be TechnicianAssigned or InProgress to update progress.', 409, 'INVALID_STATE_TRANSITION'));
    }

    request.status = status;
    request.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
    });
    await request.save({ session });

    // If resolved, return asset back to Available
    if (status === 'Resolved') {
      const asset = await Asset.findOne({ tenantId, _id: request.asset }).session(session);
      if (asset) {
        asset.status = 'Available';
        await asset.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: `MAINTENANCE_${status.toUpperCase()}`,
      entityType: 'Asset',
      entityId: request.asset,
      afterState: request.toObject(),
    });

    res.status(200).json({
      success: true,
      message: `Maintenance ticket status updated to ${status}.`,
      data: request,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getMaintenanceRequests = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, priority } = req.query;

    const filter = { tenantId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (req.user.role === 'Technician') {
      filter.technician = req.user.id;
    } else if (req.user.role === 'Employee') {
      filter.raisedBy = req.user.id;
    }

    const requests = await MaintenanceRequest.find(filter)
      .populate('asset', 'name assetTag serialNumber')
      .populate('raisedBy', 'name email')
      .populate('technician', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};
