const { registerUser, loginUser, refreshTokens, logoutUser } = require('../services/auth.service');

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

const refresh = async (req, res) => {
  try {
    // Read refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await refreshTokens(refreshToken);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user, accessToken });

  } catch (err) {
    res.clearCookie('refreshToken');
    if (err.message === 'Invalid refresh token' || err.message === 'Refresh token expired') {
      return res.status(401).json({ error: err.message });
    }
    console.error('Refresh error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await logoutUser(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, refresh, logout };