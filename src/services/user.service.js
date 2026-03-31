const userRepo = require('../repositories/user.repo');

class UserService {
  async getUserProfile(userId) {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive data
    delete user.password_hash;
    
    return user;
  }

  async updateUserProfile(userId, updates) {
    const { name, phone, bio, profile_pic_url } = updates;

    const user = await userRepo.updateProfile(userId, {
      name,
      phone,
      bio,
      profile_pic_url
    });

    if (!user) {
      throw new Error('Failed to update profile');
    }

    // Remove sensitive data
    delete user.password_hash;

    return user;
  }

  async deleteUserAccount(userId) {
    // Anonymize the user's personal data (GDPR + App Store compliant soft delete).
    // We do NOT hard-delete to preserve uploads, streams, and relational integrity.
    const db = require('../config/db');
    const crypto = require('crypto');
    const redisClient = require('../config/redis');
    
    // SAFEGUARD: Prevent Artists from Deleting Automatically
    const userRes = await db.query('SELECT artist_status FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    if (userRes.rows[0].artist_status === 'APPROVED') {
      const error = new Error('Artists cannot delete accounts automatically. Please contact support to settle your pending royalties and manage your catalog.');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    const anonymizedSuffix = crypto.randomBytes(4).toString('hex');

    await db.query('BEGIN');
    try {
      await db.query(
        `UPDATE users
         SET
           name            = $1,
           email           = $2,
           phone           = NULL,
           bio             = NULL,
           profile_pic_url = NULL,
           password_hash   = NULL,
           is_deleted      = TRUE,
           deleted_at      = NOW()
         WHERE id = $3`,
        [
          `Deleted User ${anonymizedSuffix}`,
          `deleted_${anonymizedSuffix}@faithstream.deleted`,
          userId,
        ]
      );

      // Cancel any active subscriptions
      await db.query(
        `UPDATE subscriptions SET status = 'CANCELLED', updated_at = NOW() WHERE user_id = $1 AND status = 'ACTIVE'`,
        [userId]
      );
      
      await db.query('COMMIT');
    } catch (dbError) {
      await db.query('ROLLBACK');
      throw dbError;
    }

    try {
      // Invalidate all sessions in Redis
      const sessionKey = `user_sessions:${userId}`;
      const allSessions = await redisClient.zRange(sessionKey, 0, -1);
      if (allSessions && allSessions.length > 0) {
        for (const sessId of allSessions) {
          await redisClient.set(`bl_session:${sessId}`, '1', { EX: 2592000 });
        }
      }
      await redisClient.del(sessionKey);
    } catch (redisError) {
      console.error('Failed to invalidate sessions in Redis during account deletion', redisError);
    }
  }
}

module.exports = new UserService();
