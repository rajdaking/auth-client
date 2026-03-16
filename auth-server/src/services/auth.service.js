const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const registerUser = async (email, password) => {

  // Check if user already exists
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error('Email already in use');
  }

  // Hash the password (12 rounds = strong but not too slow)
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // Insert user into database, role is user for now, maybe think about adding more roles in the future
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'user')
     RETURNING id, email, role, created_at`,
    [email, password_hash]
  );

  return result.rows[0];
};

const generateTokens = async (user) => {

  // Access token — short lived (15 mins)
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  // Refresh token — long lived (7 days)
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenFamily = crypto.randomUUID();

  // Hash the refresh token before storing 
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, tokenHash, tokenFamily, expiresAt]
  );

  return { accessToken, refreshToken };
};

const loginUser = async (email, password) => {

  // Find user by email
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is locked
  if (user.is_locked) {
    throw new Error('Account locked. Too many failed attempts');
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    // Increment failed attempts
    await pool.query(
      `UPDATE users
       SET failed_attempts = failed_attempts + 1,
           is_locked = (failed_attempts + 1 >= 5)
       WHERE id = $1`,
      [user.id]
    );
    throw new Error('Invalid credentials');
  }

  // Reset failed attempts on successful login
  await pool.query(
    'UPDATE users SET failed_attempts = 0, is_locked = false WHERE id = $1',
    [user.id]
  );

  const tokens = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    ...tokens
  };
};

const refreshTokens = async (refreshToken) => {

  // Hash the incoming token to compare against DB
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Look up the token in DB
  const result = await pool.query(
    `SELECT rt.*, u.email, u.role
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  const storedToken = result.rows[0];

  // Token not found — possible reuse attack
  if (!storedToken) {
    throw new Error('Invalid refresh token');
  }

  // Token expired
  if (new Date() > new Date(storedToken.expires_at)) {
    await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
    throw new Error('Refresh token expired');
  }

  // Delete the used token (rotation — every refresh gets a new token)
  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);

  // Issue a new token pair
  const user = {
    id: storedToken.user_id,
    email: storedToken.email,
    role: storedToken.role
  };

  const tokens = await generateTokens(user);

  return { user, ...tokens };
};

const logoutUser = async (refreshToken) => {

  if (!refreshToken) return;

  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  await pool.query(
    'DELETE FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );
};

module.exports = { registerUser, loginUser, refreshTokens, logoutUser };