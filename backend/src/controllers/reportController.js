import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import Booking from '../models/Booking.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Department from '../models/Department.js';
import TransferRequest from '../models/TransferRequest.js';
import AppError from '../utils/AppError.js';

export const getDashboardKPIs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { role, id, departmentId } = req.user;

    const baseFilter = { tenantId };

    let kpis = {
      assetsAvailable: 0,
      assetsAllocated: 0,
      maintenanceTickets: 0,
      activeBookings: 0,
      pendingTransfers: 0,
      upcomingReturns: 0,
    };

    if (role === 'Admin' || role === 'AssetManager') {
      kpis.assetsAvailable = await Asset.countDocuments({ ...baseFilter, status: 'Available' });
      kpis.assetsAllocated = await Asset.countDocuments({ ...baseFilter, status: 'Allocated' });
      kpis.maintenanceTickets = await MaintenanceRequest.countDocuments({ ...baseFilter, status: { $in: ['Pending', 'Approved', 'InProgress', 'TechnicianAssigned'] } });
      kpis.activeBookings = await Booking.countDocuments({ ...baseFilter, status: 'Ongoing' });
      kpis.pendingTransfers = await TransferRequest.countDocuments({ ...baseFilter, status: 'Requested' });
      kpis.upcomingReturns = await Allocation.countDocuments({ ...baseFilter, status: 'Active', expectedReturnDate: { $ne: null } });
    } else if (role === 'DepartmentHead') {
      const deptFilter = { ...baseFilter, department: departmentId };
      kpis.assetsAvailable = await Asset.countDocuments({ ...deptFilter, status: 'Available' });
      kpis.assetsAllocated = await Asset.countDocuments({ ...deptFilter, status: 'Allocated' });
      kpis.maintenanceTickets = await MaintenanceRequest.countDocuments({ ...baseFilter, status: 'Pending' });
      kpis.activeBookings = await Booking.countDocuments({ ...baseFilter, department: departmentId, status: 'Ongoing' });
      
      // Get all allocations of this department to match transfers
      const deptAllocations = await Allocation.find({ ...baseFilter, holderDepartment: departmentId }).select('_id');
      const deptAllocationIds = deptAllocations.map(a => a._id);

      kpis.pendingTransfers = await TransferRequest.countDocuments({
        ...baseFilter,
        status: 'Requested',
        $or: [
          { requestedForDepartment: departmentId },
          { fromAllocation: { $in: deptAllocationIds } }
        ]
      });
      kpis.upcomingReturns = await Allocation.countDocuments({ ...baseFilter, holderDepartment: departmentId, status: 'Active', expectedReturnDate: { $ne: null } });
    } else {
      kpis.assetsAllocated = await Allocation.countDocuments({ ...baseFilter, holderUser: id, status: 'Active' });
      kpis.activeBookings = await Booking.countDocuments({ ...baseFilter, bookedBy: id, status: { $in: ['Upcoming', 'Ongoing'] } });
      kpis.maintenanceTickets = await MaintenanceRequest.countDocuments({ ...baseFilter, raisedBy: id, status: { $ne: 'Resolved' } });
      kpis.upcomingReturns = await Allocation.countDocuments({ ...baseFilter, holderUser: id, status: 'Active', expectedReturnDate: { $ne: null } });
    }

    res.status(200).json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    next(error);
  }
};

export const getUtilizationReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const allocationStats = await Allocation.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      { $group: { _id: '$asset', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const populatedStats = await Asset.populate(allocationStats, {
      path: '_id',
      select: 'name assetTag status',
    });

    const results = populatedStats.map((item) => ({
      asset: item._id,
      utilizationCount: item.count,
    }));

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceFrequencyReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const maintenanceStats = await MaintenanceRequest.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      { $group: { _id: '$asset', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const populatedStats = await Asset.populate(maintenanceStats, {
      path: '_id',
      select: 'name assetTag status category',
    });

    const results = populatedStats.map((item) => ({
      asset: item._id,
      ticketCount: item.count,
    }));

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getRetirementForecastReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const assetsNearingRetirement = await Asset.find({
      tenantId,
      acquisitionDate: { $lte: threeYearsAgo },
      status: { $nin: ['Retired', 'Disposed'] },
    })
      .populate('category', 'name')
      .limit(20);

    res.status(200).json({
      success: true,
      data: assetsNearingRetirement,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentAllocationSummary = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const summary = await Asset.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          department: { $ne: null },
          status: 'Allocated',
        },
      },
      {
        $group: {
          _id: '$department',
          assetCount: { $sum: 1 },
          totalValue: { $sum: '$acquisitionCost' },
        },
      },
    ]);

    const populatedSummary = await Department.populate(summary, {
      path: '_id',
      select: 'name',
    });

    const results = populatedSummary.map((item) => ({
      department: item._id,
      assetCount: item.assetCount,
      totalValue: item.totalValue,
    }));

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingHeatmap = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const bookings = await Booking.find({ tenantId, status: { $ne: 'Cancelled' } });

    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

    bookings.forEach((booking) => {
      const start = new Date(booking.startTime);
      const day = start.getDay(); // 0 (Sun) - 6 (Sat)
      const hour = start.getHours(); // 0 - 23
      heatmap[day][hour] += 1;
    });

    res.status(200).json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    next(error);
  }
};
