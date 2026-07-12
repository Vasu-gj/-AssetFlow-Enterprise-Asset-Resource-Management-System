import mongoose from 'mongoose';
import AuditCycle from '../models/AuditCycle.js';
import AuditAssetEntry from '../models/AuditAssetEntry.js';
import Asset from '../models/Asset.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notificationService.js';

export const createAuditCycle = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;

    if (new Date(startDate) > new Date(endDate)) {
      return next(new AppError('End date must be on or after start date.', 400));
    }

    // Capture in-scope assets based on filters
    const assetFilter = { tenantId, status: { $nin: ['Retired', 'Disposed'] } };
    if (scopeDepartment) {
      assetFilter.department = scopeDepartment;
    }
    if (scopeLocation) {
      assetFilter.location = { $regex: scopeLocation, $options: 'i' };
    }

    const matchedAssets = await Asset.find(assetFilter).select('_id');
    const inScopeAssets = matchedAssets.map((a) => a._id);

    const cycle = new AuditCycle({
      tenantId,
      name,
      scopeDepartment: scopeDepartment || null,
      scopeLocation: scopeLocation || null,
      startDate,
      endDate,
      auditors,
      inScopeAssets,
      status: 'Open',
    });

    await cycle.save();

    res.status(201).json({
      success: true,
      data: cycle,
    });
  } catch (error) {
    next(error);
  }
};

export const markAuditEntry = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const cycleId = req.params.id;
    const { assetId, result, notes } = req.body;

    const cycle = await AuditCycle.findOne({ tenantId, _id: cycleId });
    if (!cycle) {
      return next(new AppError('Audit cycle not found.', 404, 'AUDIT_CYCLE_NOT_FOUND'));
    }

    if (cycle.status === 'Closed') {
      return next(new AppError('Cannot submit entries to a closed audit cycle.', 409, 'AUDIT_CLOSED'));
    }

    // Verify user is an assigned auditor
    if (!cycle.auditors.includes(req.user.id) && req.user.role !== 'Admin') {
      return next(new AppError('You are not assigned as an auditor for this cycle.', 403, 'FORBIDDEN'));
    }

    // Verify asset is in-scope
    if (!cycle.inScopeAssets.includes(assetId)) {
      return next(new AppError('Asset is not in scope for this audit cycle.', 409, 'ASSET_OUT_OF_SCOPE'));
    }

    const entry = await AuditAssetEntry.findOneAndUpdate(
      { tenantId, auditCycle: cycleId, asset: assetId },
      { markedBy: req.user.id, result, notes, markedAt: new Date() },
      { new: true, upsert: true }
    );

    // If status is Open, move it to InProgress on first mark
    if (cycle.status === 'Open') {
      cycle.status = 'InProgress';
      await cycle.save();
    }

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscrepancyReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const cycleId = req.params.id;

    const cycle = await AuditCycle.findOne({ tenantId, _id: cycleId }).populate('inScopeAssets', 'name assetTag serialNumber location');
    if (!cycle) {
      return next(new AppError('Audit cycle not found.', 404, 'AUDIT_CYCLE_NOT_FOUND'));
    }

    const entries = await AuditAssetEntry.find({ tenantId, auditCycle: cycleId });
    const entriesMap = new Map(entries.map((e) => [e.asset.toString(), e]));

    const discrepancies = [];
    const unmarked = [];

    cycle.inScopeAssets.forEach((asset) => {
      const entry = entriesMap.get(asset._id.toString());
      if (!entry) {
        unmarked.push(asset);
      } else if (entry.result === 'Missing' || entry.result === 'Damaged') {
        discrepancies.push({
          asset,
          result: entry.result,
          notes: entry.notes,
          markedBy: entry.markedBy,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        discrepancies,
        unmarked,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const closeAuditCycle = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantId = req.user.tenantId;
    const cycleId = req.params.id;

    const cycle = await AuditCycle.findOne({ tenantId, _id: cycleId }).session(session);
    if (!cycle) {
      return next(new AppError('Audit cycle not found.', 404, 'AUDIT_CYCLE_NOT_FOUND'));
    }

    if (cycle.status === 'Closed') {
      return next(new AppError('Audit cycle is already closed.', 409, 'AUDIT_CLOSED'));
    }

    // Verify all assets are marked before closing
    const entriesCount = await AuditAssetEntry.countDocuments({ tenantId, auditCycle: cycleId }).session(session);
    if (entriesCount < cycle.inScopeAssets.length) {
      return next(new AppError('Cannot close audit cycle. Some in-scope assets remain unmarked.', 409, 'UNMARKED_ASSETS_EXIST'));
    }

    // Update cycle
    cycle.status = 'Closed';
    cycle.closedBy = req.user.id;
    cycle.closedAt = new Date();
    await cycle.save({ session });

    // Process entries and adjust asset status
    const entries = await AuditAssetEntry.find({ tenantId, auditCycle: cycleId }).session(session);
    for (let entry of entries) {
      const asset = await Asset.findOne({ tenantId, _id: entry.asset }).session(session);
      if (!asset) continue;

      if (entry.result === 'Missing') {
        asset.status = 'Lost';
        await asset.save({ session });
      } else if (entry.result === 'Damaged') {
        // Trigger Pending Maintenance Request
        const maintenance = new MaintenanceRequest({
          tenantId,
          asset: asset._id,
          raisedBy: entry.markedBy,
          issueDescription: `Flagged as Damaged during Audit Cycle: ${cycle.name}. Notes: ${entry.notes || 'None'}`,
          priority: 'Medium',
          status: 'Pending',
          statusHistory: [{
            status: 'Pending',
            changedBy: entry.markedBy,
            changedAt: new Date(),
          }],
        });
        await maintenance.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'AUDIT_CYCLE_CLOSED',
      entityType: 'AuditCycle',
      entityId: cycleId,
      afterState: cycle.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Audit cycle closed and asset status modifications completed.',
      data: cycle,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getAuditCycles = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const filter = { tenantId };

    if (req.user.role === 'Employee' && req.user.role !== 'Admin' && req.user.role !== 'AssetManager') {
      filter.auditors = req.user.id;
    }

    const cycles = await AuditCycle.find(filter)
      .populate('auditors', 'name email')
      .populate('closedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cycles,
    });
  } catch (error) {
    next(error);
  }
};
