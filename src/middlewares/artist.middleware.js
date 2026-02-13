const userRepo = require('../repositories/user.repo');

module.exports = async (req, res, next) => {
  const user = await userRepo.findById(req.user.id);

  // Allow admins to bypass artist approval requirement
  if (user.is_admin) {
    return next();
  }

  if (user.artist_status !== 'APPROVED') {
    return res.status(403).json({ error: 'Approved artist only' });
  }

  next();
};
