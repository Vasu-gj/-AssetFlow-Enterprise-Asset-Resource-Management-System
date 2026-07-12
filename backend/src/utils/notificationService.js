import Notification from '../models/Notification.js';
import logger from './logger.js';

export const createNotification = async ({ tenantId, userId, type, message, entityType, entityId }) => {
  try {
    const notification = new Notification({
      tenantId,
      user: userId,
      type,
      message,
      relatedEntity: {
        entityType,
        entityId,
      },
      isRead: false,
    });
    await notification.save();
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
};
