/**
 * server.js
 * ---------------------------------------------------------
 * Entry point: connects to MongoDB then starts the HTTP server.
 * Run with:  npm run dev   (nodemon)  |  npm start
 */
const env = require('./config/env');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { User } = require('./models');

let server;

/**
 * When the API runs on the in-memory database and the database is empty,
 * insert the demo data (products, shops, users, orders ...) so the project
 * is instantly usable. Disable it with AUTO_SEED=false in server/.env.
 */
const autoSeedIfEmpty = async () => {
  if (!(env.useMemoryDb || env.isTest)) return;
  if (process.env.AUTO_SEED === 'false') return;

  const usersCount = await User.countDocuments();
  if (usersCount > 0) return;

  // eslint-disable-next-line no-console
  console.log('🌱 Empty in-memory database detected → inserting the demo data...');
  const { seedAll, printCredentials } = require('../seeds/seed');
  await seedAll();
  printCredentials();
};

const start = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();

    server = app.listen(env.port, () => {
      /* eslint-disable no-console */
      console.log('');
      console.log('🏪  Beauty Marketplace API');
      console.log('─────────────────────────────────────────────');
      console.log(`🚀  Environment : ${env.nodeEnv}`);
      console.log(`🌐  API base    : http://localhost:${env.port}/api/v1`);
      console.log(`❤️   Health      : http://localhost:${env.port}/api/v1/health`);
      console.log(`🖼️   Uploads     : http://localhost:${env.port}/uploads`);
      console.log(`🛍️   Client      : ${env.clientUrl}`);
      console.log('─────────────────────────────────────────────');
      /* eslint-enable no-console */
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Could not start the server:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      // eslint-disable-next-line no-console
      console.error('   ➜ MongoDB is not running. Start MongoDB, use Atlas, or set USE_MEMORY_DB=true');
    }
    process.exit(1);
  }
};

/** Close everything properly (Ctrl+C, nodemon restart, docker stop ...). */
const shutdown = async (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n👋 ${signal} received, shutting down gracefully...`);
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('💥 Unhandled rejection:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

start();

module.exports = server;
