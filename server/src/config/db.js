/**
 * config/db.js
 * ---------------------------------------------------------
 * MongoDB connection layer (Mongoose).
 *
 * Supports three modes:
 *   1. Local MongoDB        -> MONGODB_URI=mongodb://127.0.0.1:27017/beauty_marketplace
 *   2. MongoDB Atlas (cloud)-> MONGODB_URI=mongodb+srv://...
 *   3. In-memory MongoDB    -> USE_MEMORY_DB=true  (or NODE_ENV=test)
 *
 * The in-memory mode lets the project (and the automated tests) run
 * on a machine where MongoDB is not installed at all.
 */
const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

// Fail fast instead of buffering queries forever
mongoose.set('strictQuery', true);

const shouldUseMemory = () => env.useMemoryDb || env.isTest;

const buildMemoryUri = async () => {
  // Required lazily so production installs never load it
  const { MongoMemoryServer } = require('mongodb-memory-server');

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'beauty_marketplace' },
    });
    // eslint-disable-next-line no-console
    console.log('🧠 Using an in-memory MongoDB instance (data is lost on exit)');
  }
  return memoryServer.getUri();
};

const connectDB = async () => {
  const uri = shouldUseMemory() ? await buildMemoryUri() : env.mongoUri;

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    if (!env.isTest) console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: !env.isProd, // indexes are built automatically while developing
  });

  return mongoose.connection;
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

const dropDB = async () => {
  if (mongoose.connection.readyState !== 1) return;
  await mongoose.connection.dropDatabase();
};

module.exports = { connectDB, disconnectDB, dropDB, shouldUseMemory };
