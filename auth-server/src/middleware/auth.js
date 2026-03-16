const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    // Header format: "Bearer eyJhbGc..."
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extract just the token part after "Bearer "
    const token = authHeader.split(' ')[1];

    // Verify the token signature and expiry
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Attach user info to request so controllers can use it
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient permissions' });
    }

    next();
  };
};

module.exports = { verifyToken, verifyRole };