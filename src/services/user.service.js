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
    const anonymizedSuffix = crypto.randomBytes(4).toString('hex');

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

    // Invalidate all sessions
    await db.query(
      `UPDATE sessions SET revoked = TRUE WHERE user_id = $1`,
      [userId]
    );
  }
}

module.exports = new UserService();
