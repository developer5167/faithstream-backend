const userService = require('../services/user.service');

class UserController {
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserProfile(userId);
      
      res.json({
        success: true,
        user,
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, phone, bio, profile_pic_url } = req.body;

      const user = await userService.updateUserProfile(userId, {
        name,
        phone,
        bio,
        profile_pic_url
      });

      res.json({
        success: true,
        user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
