import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../utils/activityLogger.js';

export const getEmployees = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { department, role, status, search } = req.query;

    const filter = { tenantId };

    if (department) {
      filter.department = department;
    }
    if (role) {
      filter.role = role;
    }
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter)
      .select('-passwordHash')
      .populate('department', 'name');

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeRole = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const targetUserId = req.params.id;
    const { role } = req.body;

    const user = await User.findOne({ tenantId, _id: targetUserId });
    if (!user) {
      return next(new AppError('Employee not found.', 404, 'USER_NOT_FOUND'));
    }

    // Capture before state
    const beforeState = { role: user.role };

    // Update
    user.role = role;
    user.lastRoleChangedBy = req.user.id;
    user.lastRoleChangedAt = new Date();
    await user.save();

    // Log Activity
    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'ROLE_PROMOTED',
      entityType: 'User',
      entityId: user._id,
      beforeState,
      afterState: { role },
    });

    res.status(200).json({
      success: true,
      message: `Employee role updated to ${role} successfully.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const targetUserId = req.params.id;
    const { status } = req.body;

    const user = await User.findOne({ tenantId, _id: targetUserId });
    if (!user) {
      return next(new AppError('Employee not found.', 404, 'USER_NOT_FOUND'));
    }

    const beforeState = { status: user.status };

    user.status = status;
    await user.save();

    await logActivity({
      tenantId,
      actorId: req.user.id,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: user._id,
      beforeState,
      afterState: { status },
    });

    res.status(200).json({
      success: true,
      message: `Employee status updated to ${status} successfully.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
