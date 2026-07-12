import ActivityLog from '../models/ActivityLog.js';
import logger from './logger.js';

export const logActivity = async ({ tenantId, actorId, action, entityType, entityId, beforeState = null, afterState = null }) => {
  try {
    const activity = new ActivityLog({
      tenantId,
      actor: actorId,
      action,
      targetEntity: {
        entityType,
        entityId,
      },
      beforeState,
      afterState,
    });
    await activity.save();
  } catch (error) {
    logger.error('Failed to save activity log:', error);
  }
};
