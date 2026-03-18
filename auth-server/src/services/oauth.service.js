const axios = require('axios');
const pool = require('../config/db');
const { generateTokens } = require('./auth.service');

const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state: generateState(),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

const handleGoogleCallback = async (code) => {
  // Exchange code for tokens
  const { data: tokenData } = await axios.post(
    'https://oauth2.googleapis.com/token',
    {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }
  );

  // Get user profile from Google
  const { data: profile } = await axios.get(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );

  return await findOrCreateOAuthUser(profile.email, 'google', profile.sub);
};

const findOrCreateOAuthUser = async (email, provider, providerId) => {
  // Check if OAuth account already exists
  const existingOAuth = await pool.query(
    `SELECT u.* FROM oauth_accounts oa
     JOIN users u ON oa.user_id = u.id
     WHERE oa.provider = $1 AND oa.provider_id = $2`,
    [provider, providerId]
  );

  if (existingOAuth.rows.length > 0) {
    return await generateTokens(existingOAuth.rows[0]);
  }

  // Check if user exists with this email
  const existingUser = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  let user;

  if (existingUser.rows.length > 0) {
    // Link OAuth to existing account
    user = existingUser.rows[0];
  } else {
    // Create new user
    const result = await pool.query(
      `INSERT INTO users (email, role)
       VALUES ($1, 'user')
       RETURNING *`,
      [email]
    );
    user = result.rows[0];
  }

  // Create OAuth account link
  await pool.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_id)
     VALUES ($1, $2, $3)`,
    [user.id, provider, providerId]
  );

  return await generateTokens(user);
};

const generateState = () => {
  return Math.random().toString(36).substring(2, 15);
};

module.exports = { getGoogleAuthUrl, handleGoogleCallback };