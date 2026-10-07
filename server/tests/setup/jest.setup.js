/**
 * tests/setup/jest.setup.js
 * ---------------------------------------------------------
 * Global test configuration. The in-memory MongoDB needs a few
 * extra seconds on the first run (it downloads/starts mongod).
 */
jest.setTimeout(120000);

// Keep the test output readable
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/beauty_test';

afterAll(async () => {
  // Give the mongoose connection a moment to close cleanly
  await new Promise((resolve) => setTimeout(resolve, 200));
});
