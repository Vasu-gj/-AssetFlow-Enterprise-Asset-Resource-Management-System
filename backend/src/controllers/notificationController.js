import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';

export const getNotifications = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const notifications = await Notification.find({ tenantId, user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({ tenantId, _id: notificationId, user: userId });
    if (!notification) {
      return next(new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND'));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
