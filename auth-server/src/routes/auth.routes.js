const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { authLimiter, loginLimiter } = require('../middleware/rateLimiter');


// Apply general limiter to all auth routes. Remove or increase max attribute if any endpoint will be called many times within window
router.use(authLimiter);

router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected route — any logged in user
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Protected route — admin only
router.get('/admin', verifyToken, verifyRole('admin'), (req, res) => {
  res.json({ message: 'Welcome admin!' });
});

module.exports = router;