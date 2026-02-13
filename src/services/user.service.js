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
}

module.exports = new UserService();
