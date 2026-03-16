const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
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