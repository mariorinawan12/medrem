/**
 * Push Notification Service
 * 
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 * Includes retry logic, error handling, and token validation
 */

const { getMessaging, isFirebaseInitialized } = require('../config/firebase-admin');
const { User } = require('../models');


function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // FCM tokens are typically 152-163 characters long
  // They contain alphanumeric characters, hyphens, underscores, and colons
  const tokenRegex = /^[a-zA-Z0-9_:-]{100,200}$/;
  return tokenRegex.test(token);
}


async function sendNotification(userId, notification) {
  try {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      console.error('[Push Service] Firebase Admin SDK not initialized');
      return {
        success: false,
        error: 'Firebase not initialized'
      };
    }

    // Get user's FCM tokens from database
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`[Push Service] User ${userId} not found`);
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Get tokens (handle string (old), array (new), or null)
    let tokens = [];
    if (Array.isArray(user.fcmToken)) {
      tokens = user.fcmToken;
    } else if (typeof user.fcmToken === 'string') {
      try {
        const parsed = JSON.parse(user.fcmToken);
        if (Array.isArray(parsed)) {
          tokens = parsed;
        } else {
          tokens = [user.fcmToken];
        }
      } catch (e) {
        tokens = [user.fcmToken];
      }
    }

    if (tokens.length === 0) {
      console.log(`[Push Service] User ${userId} has no FCM tokens`);
      return {
        success: false,
        error: 'No FCM tokens'
      };
    }

    // Prepare FCM message payload
    const dataPayload = {
      title: notification.title,
      body: notification.body,
    };

    if (notification.data) {
      for (const [key, value] of Object.entries(notification.data)) {
        dataPayload[key] = String(value);
      }
    }

    const messaging = getMessaging();
    const invalidTokens = [];
    let successCount = 0;
    let lastMessageId = null;

    // Send to all tokens
    for (const token of tokens) {
      // Validate token format
      if (!validateToken(token)) {
        console.log(`[Push Service] Invalid token format, marking for removal`);
        invalidTokens.push(token);
        continue;
      }

      try {
        const message = {
          token: token,
          data: dataPayload
        };

        const messageId = await messaging.send(message);
        successCount++;
        lastMessageId = messageId;
        console.log(`[Push Service] ✓ Sent to token ${token.substring(0, 20)}...`);
      } catch (error) {
        console.error(`[Push Service] Error sending to token:`, error.message);

        // Mark invalid/expired tokens for removal
        if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(token);
        }
      }
    }

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      const validTokens = tokens.filter(t => !invalidTokens.includes(t));
      await User.update(
        { fcmToken: validTokens },
        { where: { userId } }
      );
      console.log(`[Push Service] Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
    }

    if (successCount > 0) {
      console.log(`[Push Service] ✓ Notification sent to ${successCount}/${tokens.length} devices for user ${userId}`);
      return {
        success: true,
        messageId: lastMessageId,
        sentCount: successCount
      };
    } else {
      return {
        success: false,
        error: 'Failed to send to any device'
      };
    }

  } catch (error) {
    console.error(`[Push Service] Error sending notification to user ${userId}:`, error.message);
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
}


async function sendWithRetry(userId, notification, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Push Service] Attempt ${attempt}/${maxRetries} for user ${userId}`);

    const result = await sendNotification(userId, notification);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry for certain errors
    const nonRetryableErrors = [
      'User not found',
      'No FCM token',
      'Invalid token format',
      'Firebase not initialized'
    ];

    if (nonRetryableErrors.includes(result.error)) {
      console.log(`[Push Service] Non-retryable error, stopping attempts`);
      break;
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`[Push Service] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`[Push Service] ✗ Failed to send notification to user ${userId} after ${maxRetries} attempts`);

  return {
    success: false,
    error: lastError,
    attempts: maxRetries
  };
}


async function sendToMultipleUsers(userIds, notification) {
  console.log(`[Push Service] Sending notification to ${userIds.length} users`);

  const results = await Promise.allSettled(
    userIds.map(userId => sendNotification(userId, notification))
  );

  const summary = {
    total: userIds.length,
    successful: 0,
    failed: 0,
    results: []
  };

  results.forEach((result, index) => {
    const userId = userIds[index];

    if (result.status === 'fulfilled' && result.value.success) {
      summary.successful++;
      summary.results.push({
        userId,
        success: true,
        messageId: result.value.messageId
      });
    } else {
      summary.failed++;
      const error = result.status === 'fulfilled' ? result.value.error : result.reason.message;
      summary.results.push({
        userId,
        success: false,
        error
      });
    }
  });

  console.log(`[Push Service] Batch complete: ${summary.successful} successful, ${summary.failed} failed`);

  return summary;
}

module.exports = {
  sendNotification,
  sendWithRetry,
  sendToMultipleUsers,
  validateToken
};
