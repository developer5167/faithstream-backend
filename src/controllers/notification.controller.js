const fcmTokenRepo = require('../repositories/fcm-token.repo');

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
