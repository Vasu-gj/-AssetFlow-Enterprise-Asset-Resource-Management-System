import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import TransferRequest from '../models/TransferRequest.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notificationService.js';

export const allocateAsset = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const { assetId, holderType, holderUser, holderDepartment, expectedReturnDate } = req.body;

    // Check targets exist
    if (holderType === 'Employee') {
      if (!holderUser) return next(new AppError('holderUser is required for Employee type', 400));
      const userExists = await User.findOne({ tenantId, _id: holderUser });
      if (!userExists) return next(new AppError('Target employee user not found', 404, 'USER_NOT_FOUND'));
    } else {
      if (!holderDepartment) return next(new AppError('holderDepartment is required for Department type', 400));
      const deptExists = await Department.findOne({ tenantId, _id: holderDepartment });
      if (!deptExists) return next(new AppError('Target department not found', 404, 'DEPARTMENT_NOT_FOUND'));
    }

    // Atomic update status check to prevent race conditions
    const asset = await Asset.findOneAndUpdate(
      { _id: assetId, tenantId, status: 'Available' },
      { status: 'Allocated' },
      { new: true, session }
    );

    if (!asset) {
      // Find current holder info for friendly error message
      const activeAllocation = await Allocation.findOne({ tenantId, asset: assetId, status: 'Active' })
        .populate('holderUser', 'name')
        .populate('holderDepartment', 'name');

      let currentHolder = 'unknown';
      if (activeAllocation) {
        currentHolder = activeAllocation.holderType === 'Employee' 
          ? activeAllocation.holderUser?.name 
          : activeAllocation.holderDepartment?.name;
      }

      return next(new AppError(`Asset allocation blocked. Asset is currently held by ${currentHolder}.`, 409, 'ASSET_NOT_AVAILABLE', { currentHolder }));
    }

    const allocation = new Allocation({
      tenantId,
      asset: assetId,
      holderType,
      holderUser: holderType === 'Employee' ? holderUser : null,
      holderDepartment: holderType === 'Department' ? holderDepartment : null,
      allocatedDate: new Date(),
      expectedReturnDate: expectedReturnDate || null,
      allocatedBy: req.user.id,
      status: 'Active',
    });

    await allocation.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Log Activity & Create Notification
    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'ASSET_ALLOCATED',
      entityType: 'Asset',
      entityId: assetId,
      afterState: allocation.toObject(),
    });

    if (holderType === 'Employee') {
      await createNotification({
        tenantId,
        userId: holderUser,
        type: 'ASSET_ASSIGNED',
        message: `Asset ${asset.assetTag} (${asset.name}) has been allocated to you.`,
        entityType: 'Asset',
        entityId: assetId,
      });
    }

    res.status(201).json({
      success: true,
      data: allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const returnAsset = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const allocationId = req.params.id;
    const { conditionCheckInNotes, condition } = req.body;

    const allocation = await Allocation.findOne({ tenantId, _id: allocationId, status: 'Active' });
    if (!allocation) {
      return next(new AppError('Active allocation not found.', 404, 'ALLOCATION_NOT_FOUND'));
    }

    // Verify returning authority (holder or manager)
    if (allocation.holderType === 'Employee' && allocation.holderUser.toString() !== req.user.id && req.user.role !== 'AssetManager' && req.user.role !== 'Admin') {
      return next(new AppError('Unauthorized to return this asset.', 403, 'FORBIDDEN'));
    }

    // Update allocation
    allocation.actualReturnDate = new Date();
    allocation.conditionCheckInNotes = conditionCheckInNotes || null;
    allocation.status = 'Returned';
    await allocation.save({ session });

    // Revert asset back to Available
    const asset = await Asset.findOne({ tenantId, _id: allocation.asset }).session(session);
    if (asset) {
      asset.status = 'Available';
      if (condition) {
        asset.condition = condition;
      }
      await asset.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'ASSET_RETURNED',
      entityType: 'Asset',
      entityId: allocation.asset,
      afterState: allocation.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Asset returned successfully.',
      data: allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const createTransferRequest = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { assetId, requestedForUser, requestedForDepartment } = req.body;

    // Check if asset exists and is currently allocated
    const asset = await Asset.findOne({ tenantId, _id: assetId });
    if (!asset || asset.status !== 'Allocated') {
      return next(new AppError('Transfer request blocked. Target asset is not currently allocated.', 409, 'ASSET_NOT_ALLOCATED'));
    }

    // Find the active allocation
    const activeAllocation = await Allocation.findOne({ tenantId, asset: assetId, status: 'Active' });
    if (!activeAllocation) {
      return next(new AppError('Active allocation not found for this asset.', 404, 'ALLOCATION_NOT_FOUND'));
    }

    const transfer = new TransferRequest({
      tenantId,
      asset: assetId,
      fromAllocation: activeAllocation._id,
      requestedBy: req.user.id,
      requestedForUser: requestedForUser || null,
      requestedForDepartment: requestedForDepartment || null,
      status: 'Requested',
    });

    await transfer.save();

    res.status(201).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const approveTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const transferId = req.params.id;
    const { decisionNotes } = req.body;

    const transfer = await TransferRequest.findOne({ tenantId, _id: transferId, status: 'Requested' });
    if (!transfer) {
      return next(new AppError('Pending transfer request not found.', 404, 'TRANSFER_NOT_FOUND'));
    }

    const activeAllocation = await Allocation.findOne({ tenantId, _id: transfer.fromAllocation, status: 'Active' });
    if (!activeAllocation) {
      return next(new AppError('Active allocation is no longer valid.', 404, 'ALLOCATION_NOT_FOUND'));
    }

    // Close old allocation
    activeAllocation.actualReturnDate = new Date();
    activeAllocation.status = 'Returned';
    activeAllocation.conditionCheckInNotes = 'Returned via Transfer Request';
    await activeAllocation.save({ session });

    // Create new allocation
    const holderType = transfer.requestedForUser ? 'Employee' : 'Department';
    const newAllocation = new Allocation({
      tenantId,
      asset: transfer.asset,
      holderType,
      holderUser: transfer.requestedForUser,
      holderDepartment: transfer.requestedForDepartment,
      allocatedDate: new Date(),
      allocatedBy: req.user.id,
      status: 'Active',
    });
    await newAllocation.save({ session });

    // Update Transfer
    transfer.status = 'Approved';
    transfer.approvedBy = req.user.id;
    transfer.decisionNotes = decisionNotes || null;
    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Log & Notify
    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'TRANSFER_APPROVED',
      entityType: 'Asset',
      entityId: transfer.asset,
      afterState: newAllocation.toObject(),
    });

    if (transfer.requestedForUser) {
      await createNotification({
        tenantId,
        userId: transfer.requestedForUser,
        type: 'TRANSFER_APPROVED',
        message: `Your transfer request for asset has been approved and allocated to you.`,
        entityType: 'Asset',
        entityId: transfer.asset,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transfer request approved and asset custody updated.',
      data: newAllocation,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const rejectTransfer = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const transferId = req.params.id;
    const { decisionNotes } = req.body;

    const transfer = await TransferRequest.findOne({ tenantId, _id: transferId, status: 'Requested' });
    if (!transfer) {
      return next(new AppError('Pending transfer request not found.', 404, 'TRANSFER_NOT_FOUND'));
    }

    transfer.status = 'Rejected';
    transfer.approvedBy = req.user.id;
    transfer.decisionNotes = decisionNotes || null;
    await transfer.save();

    await createNotification({
      tenantId,
      userId: transfer.requestedBy,
      type: 'TRANSFER_REJECTED',
      message: `Your transfer request was rejected. Notes: ${decisionNotes || 'None'}`,
      entityType: 'Asset',
      entityId: transfer.asset,
    });

    res.status(200).json({
      success: true,
      message: 'Transfer request rejected.',
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllocations = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, holderType } = req.query;

    const filter = { tenantId };
    if (status) filter.status = status;
    if (holderType) filter.holderType = holderType;

    // Standard scoping for non-admin/managers
    if (req.user.role === 'Employee') {
      filter.holderUser = req.user.id;
    }

    const allocations = await Allocation.find(filter)
      .populate('asset', 'name assetTag serialNumber')
      .populate('holderUser', 'name email')
      .populate('holderDepartment', 'name')
      .populate('allocatedBy', 'name');

    res.status(200).json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransferRequests = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status } = req.query;

    const filter = { tenantId };
    if (status) filter.status = status;

    if (req.user.role === 'Employee') {
      filter.$or = [
        { requestedBy: req.user.id },
        { requestedForUser: req.user.id },
      ];
    }

    const transfers = await TransferRequest.find(filter)
      .populate('asset', 'name assetTag')
      .populate('requestedBy', 'name email')
      .populate('requestedForUser', 'name email')
      .populate('requestedForDepartment', 'name')
      .populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};
