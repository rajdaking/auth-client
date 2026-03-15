const { registerUser, loginUser } = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation TODO: add more validations, especially for valid email
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await registerUser(email, password);

    res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (err) {
    if (err.message === 'Email already in use') {
      return res.status(409).json({ error: err.message });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,      // JS cannot access this cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    res.json({ user, accessToken });

  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ error: err.message });
    }
    if (err.message.includes('locked')) {
      return res.status(423).json({ error: err.message });
    }
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login };