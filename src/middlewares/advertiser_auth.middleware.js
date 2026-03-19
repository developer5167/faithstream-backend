const jwtUtil = require('../utils/jwt.util');
const advertiserRepo = require('../repositories/advertiser.repo');

module.exports = async (req, res, next) => {
  // ✅ Prefer HttpOnly cookie (XSS-safe) over Authorization header
  // The cookie is set by the backend on login/signup and is invisible to JS.
  // Fallback to Authorization header only for the shared upload route, which
  // runs its own pre-verification before calling this middleware.
  const token = req.cookies?.advertiser_token
    || (req.headers.authorization?.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwtUtil.verify(token);
    
    // Safety check: ensure it's an advertiser token
    if (decoded.type !== 'advertiser') {
      return res.status(403).json({ error: 'Access denied: Not an advertiser account' });
    }

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
