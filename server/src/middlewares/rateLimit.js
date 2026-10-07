/**
 * middlewares/rateLimit.js
 * ---------------------------------------------------------
 * Basic protection against brute-force / abuse.
 */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const skipInTests = () => env.isTest;

/** Global limiter for the whole API. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many requests, please try again later' },
});

/** Stricter limiter for login / register. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
});

module.exports = { apiLimiter, authLimiter };
