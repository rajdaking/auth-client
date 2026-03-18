const { getGoogleAuthUrl, handleGoogleCallback } = require('../services/oauth.service');

const googleAuth = (req, res) => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
};

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect('http://localhost:5173/login?error=no_code');
    }

    const { accessToken, refreshToken } = await handleGoogleCallback(code);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Pass access token to frontend via URL param
    // It's short lived (15min) so this is acceptable
    res.redirect(`http://localhost:5173/oauth/callback?token=${accessToken}`);

  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect('http://localhost:5173/login?error=oauth_failed');
  }
};

module.exports = { googleAuth, googleCallback };