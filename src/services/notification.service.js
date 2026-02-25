const admin = require('firebase-admin');
const path = require('path');
const fcmTokenRepo = require('../repositories/fcm-token.repo');

let isInitialized = false;

// Initialize Firebase Admin (lazy load when needed, but safely configured)
function _ensureInitialized() {
  if (isInitialized) return true;
  
  if (admin.apps.length > 0) {
    isInitialized = true;
    return true;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    console.warn('[Notification] FIREBASE_SERVICE_ACCOUNT_PATH not set in .env. Push notifications disabled.');
    return false;
  }

  try {
    // The .env path is already absolute: /Users/kcs/Documents/MPP/faithstream-backend/service-account.json
    let absolutePath = serviceAccountPath.trim();
    if (!absolutePath.startsWith('/')) {
      absolutePath = path.resolve(__dirname, '../../', absolutePath);
    }
    
    console.log(`[Notification] Loading Firebase service account from: ${absolutePath}`);
    
    const serviceAccount = require(absolutePath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('[Notification] Firebase Admin SDK initialized successfully for project:', serviceAccount.project_id);
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Notification] Failed to initialize Firebase Admin SDK:', error.message);
    return false;
  }
}

/**
 * Send a push notification to a specific user.
 */
exports.sendToUser = async (userId, title, body, data = {}) => {
  if (!_ensureInitialized()) return;

  try {
    const token = await fcmTokenRepo.getToken(userId);
    if (!token) {
      console.log(`[Notification] No FCM token found for user: ${userId}`);
      return;
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', 
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Notification] Successfully sent to user ${userId}:`, response);
    return response;
  } catch (error) {
    console.error(`[Notification] Error sending to user ${userId}:`, error.message);
    
    // If token is invalid/unregistered, delete it from our DB
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log(`[Notification] Token invalid for user ${userId}, deleting from DB.`);
      await fcmTokenRepo.deleteToken(userId);
    }
  }
};

/**
 * Send push notifications to multiple users.
 */
exports.sendToUsers = async (userIds, title, body, data = {}) => {
  if (!_ensureInitialized()) return;
  if (!userIds || userIds.length === 0) return;

  try {
    const tokens = await fcmTokenRepo.getTokens(userIds);
    if (tokens.length === 0) {
      console.log(`[Notification] No FCM tokens found for the specified users.`);
      return;
    }

    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[Notification] Multicast sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    
    // Cleanup invalid tokens if any
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            const invalidToken = tokens[idx];
            console.log(`[Notification] Token ${invalidToken} is invalid, consider manual cleanup.`);
            // Note: In a real app we'd map back token -> user_id for cleanup
          }
        }
      });
    }

    return response;
  } catch (error) {
    console.error(`[Notification] Error in multicast send:`, error.message);
  }
};

/**
 * Send a push notification to a topic (useful for broadcasts)
 */
exports.sendToTopic = async (topic, title, body, data = {}) => {
  if (!_ensureInitialized()) return;

  try {
    const message = {
      topic,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', 
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Notification] Successfully sent to topic ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`[Notification] Error sending to topic ${topic}:`, error.message);
  }
};
