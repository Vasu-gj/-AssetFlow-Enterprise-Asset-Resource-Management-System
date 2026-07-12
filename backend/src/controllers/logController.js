import ActivityLog from '../models/ActivityLog.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const filter = { tenantId };

    // Standard scoping for employees
    if (req.user.role === 'Employee') {
      filter.actor = req.user.id;
    }

    const logs = await ActivityLog.find(filter)
      .populate('actor', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
