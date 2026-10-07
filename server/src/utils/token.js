/**
 * utils/token.js
 * ---------------------------------------------------------
 * JWT creation + cookie options (one place to change auth behaviour).
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign an access token for a user document.
 * @param {{_id:any, role:string}} user
 */
const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

/** Cookie options used by `res.cookie(...)` (optional cookie auth). */
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: env.isProd ? 'strict' : 'lax',
  secure: env.isProd,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

module.exports = { signToken, verifyToken, cookieOptions };
