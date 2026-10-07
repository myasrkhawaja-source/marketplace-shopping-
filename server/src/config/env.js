/**
 * config/env.js
 * ---------------------------------------------------------
 * Loads and validates environment variables in ONE place,
 * so the rest of the code never touches `process.env` directly.
 */
const path = require('path');
const dotenv = require('dotenv');

// Always read `server/.env` (regardless of the current working directory)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,

  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/beauty_marketplace',
  useMemoryDb: toBool(process.env.USE_MEMORY_DB, false),

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'change_this_super_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',

  // Uploads
  maxFileUploadMb: Number(process.env.MAX_FILE_UPLOAD_MB) || 5,

  // Client
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Safety check: never ship a weak secret to production
if (env.nodeEnv === 'production' && env.jwtSecret === 'change_this_super_secret_key') {
  // eslint-disable-next-line no-console
  console.error('❌ FATAL: set a strong JWT_SECRET in your .env before running in production.');
  process.exit(1);
}

env.isDev = env.nodeEnv === 'development';
env.isTest = env.nodeEnv === 'test';
env.isProd = env.nodeEnv === 'production';

module.exports = env;
