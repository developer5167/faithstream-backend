const jwtUtil = require('../utils/jwt.util');
const advertiserRepo = require('../repositories/advertiser.repo');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const decoded = jwtUtil.verify(token);
    
    // Safety check: ensure it's an advertiser token
    if (decoded.type !== 'advertiser') {
      return res.status(403).json({ error: 'Access denied: Not an advertiser account' });
    }

    // Optional: Check if token exists in database (for logout/revocation support)
    // For now we just verify ID exists
    const advertiser = await advertiserRepo.findById(decoded.id);
    if (!advertiser) {
      return res.status(401).json({ error: 'Advertiser account not found' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
