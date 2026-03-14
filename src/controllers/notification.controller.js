const fcmTokenRepo = require('../repositories/fcm-token.repo');
const notificationRepo = require('../repositories/notification.repo');

exports.registerToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const userId = req.user.id;

    if (!fcm_token) {
      return res.status(400).json({ success: false, message: 'fcm_token is required' });
    }

    await fcmTokenRepo.upsertToken(userId, fcm_token);
    res.json({ success: true, message: 'FCM token registered successfully' });
  } catch (error) {
    console.error('[Notification Controller] Error registering token:', error);
    res.status(500).json({ success: false, message: 'Server error registering token' });
  }
};

exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationService = require('../services/notification.service');
    
    await notificationService.sendToUser(
      userId,
      '🧪 Test Notification',
      'This is a test push notification from FaithStream!',
      { type: 'test_notification' }
    );
    
    res.json({ success: true, message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('[Notification Controller] Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Server error sending test notification' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await notificationRepo.findByUser(userId, { page, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Notification Controller] Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationRepo.markAsRead(id, userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('[Notification Controller] Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error marking notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationRepo.markAllAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[Notification Controller] Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error marking all notifications as read' });
  }
};
