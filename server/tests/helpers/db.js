/**
 * tests/helpers/db.js
 * ---------------------------------------------------------
 * Small helpers shared by every test file:
 * connect to the in-memory MongoDB, clean the collections,
 * and create the demo users used by the requests.
 */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../../src/config/db');
const { User, Shop, Category, Product } = require('../../src/models');
const { signToken } = require('../../src/utils/token');
const { ROLES, SHOP_STATUS, PRODUCT_STATUS } = require('../../src/config/constants');

/** Connect once per test file. */
const connect = async () => {
  if (mongoose.connection.readyState === 0) await connectDB();
  return mongoose.connection;
};

/** Empty every collection (indexes stay in place). */
const clearDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

/** Disconnect the in-memory server. */
const closeDatabase = async () => {
  await disconnectDB();
};

/** Authorization header ready to use with supertest. */
const authHeader = (user) => ({ Authorization: `Bearer ${signToken(user)}` });

/* ------------------------- Factories ------------------------- */

const createUser = (overrides = {}) =>
  User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user${Date.now()}${Math.random().toString(16).slice(2, 6)}@test.com`,
    password: overrides.password || 'password123',
    role: overrides.role || ROLES.CUSTOMER,
    phone: overrides.phone || '0599-000-000',
    ...overrides,
  });

const createCategory = (overrides = {}) =>
  Category.create({ name: overrides.name || `Category ${Date.now()}`, kind: 'both', ...overrides });

/** A seller + an approved shop (the common case). */
const createSeller = async (shopOverrides = {}) => {
  const seller = await createUser({
    name: 'Seller Test',
    role: ROLES.SELLER,
    email: `seller${Date.now()}${Math.random().toString(16).slice(2, 6)}@test.com`,
  });

  const shop = await Shop.create({
    owner: seller._id,
    name: shopOverrides.name || `Test Shop ${Date.now()}`,
    city: shopOverrides.city || 'Ramallah',
    status: shopOverrides.status || SHOP_STATUS.APPROVED,
    ...shopOverrides,
    owner: seller._id,
  });

  return { seller, shop };
};

/** An approved physical product (optionally attached to a given shop). */
const createProduct = async (overrides = {}) => {
  let shop = overrides.shop;
  let seller = overrides.seller;

  if (!shop) {
    const created = await createSeller();
    shop = created.shop;
    seller = created.seller;
  }

  const category = overrides.category || (await createCategory())._id;

  return Product.create({
    name: overrides.name || `Product ${Date.now()}`,
    description: overrides.description || 'A very nice beauty product used for the tests.',
    category,
    type: overrides.type || 'product',
    price: overrides.price ?? 100,
    discountPrice: overrides.discountPrice ?? null,
    stock: overrides.stock ?? 10,
    images: overrides.images || ['https://picsum.photos/seed/test/600/600'],
    status: overrides.status || PRODUCT_STATUS.APPROVED,
    shop: shop._id,
    seller: seller._id,
    city: shop.city || 'Ramallah',
    ...overrides,
    category,
    shop: shop._id,
    seller: seller._id,
  });
};

module.exports = {
  connect,
  clearDatabase,
  closeDatabase,
  authHeader,
  createUser,
  createCategory,
  createSeller,
  createProduct,
};
