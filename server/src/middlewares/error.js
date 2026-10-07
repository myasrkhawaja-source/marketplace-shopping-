/**
 * middlewares/error.js
 * ---------------------------------------------------------
 * 1) notFound      -> any unknown route
 * 2) errorHandler  -> converts every thrown error (including
 *    Mongoose / JWT errors) into a clean JSON payload.
 */
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/** 404 for unmatched routes. */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Turn known error types into friendly field errors. */
const normalizeError = (err) => {
  let error = err;

  // Invalid ObjectId (e.g. /api/v1/products/123)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    error = ApiError.unprocessable('Please check the highlighted fields', errors);
  }

  // Duplicate key (unique index)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ') || 'value';
    error = ApiError.conflict(`This ${field} is already used, please pick another one`);
  }

  // Multer (file upload)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: `The image is too large, max ${env.maxFileUploadMb} MB`,
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    };
    error = ApiError.badRequest(messages[err.code] || `Upload error: ${err.code}`);
  }

  return error;
};

/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);

  // Log unexpected (non operational) errors with the stack for debugging
  if (!error.isOperational) {
    // eslint-disable-next-line no-console
    console.error('💥 Unexpected error:', err);
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: statusCode === 500 && env.isProd ? 'Something went wrong on the server' : error.message,
    errors: error.errors && error.errors.length ? error.errors : undefined,
  };

  if (!env.isProd) payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler, normalizeError };
