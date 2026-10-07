/**
 * app.js
 * ---------------------------------------------------------
 * Express application (middlewares + routes + error handling).
 * Kept separate from server.js so the tests can import the app
 * without opening a port.
 */
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');
const { apiLimiter } = require('./middlewares/rateLimit');

const app = express();

/* ------------------------- Security & parsers ------------------------- */
app.use(
  helmet({
    // allow the React client (different port) to load the uploaded images
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (env.isDev) app.use(morgan('dev'));

/* ------------------------- Static uploads ------------------------- */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/* ------------------------- API ------------------------- */
app.use('/api/v1', apiLimiter, apiRoutes);

// Small welcome payload so hitting the root is not a 404
app.get('/', (req, res) =>
  res.json({
    success: true,
    message: '🏪 Beauty Marketplace API',
    data: {
      version: '1.0.0',
      docs: '/api/v1/health',
      client: env.clientUrl,
    },
  })
);

/* ------------------------- Errors ------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
