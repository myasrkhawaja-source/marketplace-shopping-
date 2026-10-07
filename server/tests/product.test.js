/**
 * tests/product.test.js
 * ---------------------------------------------------------
 * Catalogue, seller CRUD and admin moderation.
 */
const request = require('supertest');
const app = require('../src/app');
const helpers = require('./helpers/db');
const { Product } = require('../src/models');
const { ROLES, PRODUCT_STATUS, SHOP_STATUS } = require('../src/config/constants');

beforeAll(async () => {
  await helpers.connect();
});

afterEach(async () => {
  await helpers.clearDatabase();
});

afterAll(async () => {
  await helpers.closeDatabase();
});

const validProductPayload = (categoryId, overrides = {}) => ({
  name: 'Luxury Face Serum',
  description: 'A premium face serum with vitamin C for a bright glowing skin.',
  category: categoryId,
  type: 'product',
  price: 150,
  discountPrice: 120,
  stock: 20,
  images: ['https://picsum.photos/seed/serum/700/700'],
  tags: ['serum', 'vitamin c'],
  ...overrides,
});

describe('GET /api/v1/products (public catalogue)', () => {
  it('only returns approved products', async () => {
    await helpers.createProduct({ name: 'Approved Product', status: PRODUCT_STATUS.APPROVED });
    await helpers.createProduct({ name: 'Pending Product', status: PRODUCT_STATUS.PENDING });

    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Approved Product');
    expect(res.body.meta.total).toBe(1);
  });

  it('does not expose the products of a suspended shop', async () => {
    await helpers.createProduct();
    const suspended = await helpers.createSeller({ status: SHOP_STATUS.SUSPENDED });
    await helpers.createProduct({ shop: suspended.shop, seller: suspended.seller });

    const res = await request(app).get('/api/v1/products');
    expect(res.body.data).toHaveLength(1);
  });

  it('supports search, price range and sorting', async () => {
    await helpers.createProduct({ name: 'Cheap Lipstick', price: 30 });
    await helpers.createProduct({ name: 'Expensive Perfume', price: 400 });

    const search = await request(app).get('/api/v1/products?search=perfume');
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].name).toBe('Expensive Perfume');

    const cheapOnly = await request(app).get('/api/v1/products?maxPrice=100');
    expect(cheapOnly.body.data).toHaveLength(1);

    const sorted = await request(app).get('/api/v1/products?sort=-price');
    expect(Number(sorted.body.data[0].price)).toBeGreaterThanOrEqual(
      Number(sorted.body.data[1].price)
    );
  });

  it('paginates the results', async () => {
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await helpers.createProduct({ name: `Product number ${i}` });
    }

    const res = await request(app).get('/api/v1/products?page=1&limit=2');

    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(5);
    expect(res.body.meta.totalPages).toBe(3);
    expect(res.body.meta.hasNextPage).toBe(true);
  });
});

describe('GET /api/v1/products/:slug', () => {
  it('returns the product with its shop and category', async () => {
    const product = await helpers.createProduct({ name: 'Rose Perfume' });

    const res = await request(app).get(`/api/v1/products/${product.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Rose Perfume');
    expect(res.body.data.product.shop).toBeTruthy();
    expect(res.body.data.product.category).toBeTruthy();
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/v1/products/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/products (seller)', () => {
  it('creates a product in the pending state', async () => {
    const { seller } = await helpers.createSeller();
    const category = await helpers.createCategory({ name: 'Skin Care Test' });

    const res = await request(app)
      .post('/api/v1/products')
      .set(helpers.authHeader(seller))
      .send(validProductPayload(category._id));

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(PRODUCT_STATUS.PENDING);
    expect(res.body.data.slug).toBeTruthy();

    // it must NOT be public yet
    const list = await request(app).get('/api/v1/products?search=Luxury Face Serum');
    expect(list.body.data).toHaveLength(0);
  });

  it('refuses a customer (wrong role)', async () => {
    const customer = await helpers.createUser({ role: ROLES.CUSTOMER });
    const category = await helpers.createCategory();

    const res = await request(app)
      .post('/api/v1/products')
      .set(helpers.authHeader(customer))
      .send(validProductPayload(category._id));

    expect(res.status).toBe(403);
  });

  it('refuses a seller whose shop is not approved yet', async () => {
    const { seller } = await helpers.createSeller({ status: SHOP_STATUS.PENDING });
    const category = await helpers.createCategory();

    const res = await request(app)
      .post('/api/v1/products')
      .set(helpers.authHeader(seller))
      .send(validProductPayload(category._id));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/waiting for the admin approval/i);
  });

  it('validates the payload (missing price)', async () => {
    const { seller } = await helpers.createSeller();
    const payload = validProductPayload('000000000000000000000000');
    delete payload.price;

    const res = await request(app)
      .post('/api/v1/products')
      .set(helpers.authHeader(seller))
      .send(payload);

    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/products/:id/moderate (admin)', () => {
  it('approves a pending product and makes it public', async () => {
    const admin = await helpers.createUser({ role: ROLES.ADMIN });
    const product = await helpers.createProduct({ status: PRODUCT_STATUS.PENDING });

    const res = await request(app)
      .put(`/api/v1/products/${product._id}/moderate`)
      .set(helpers.authHeader(admin))
      .send({ status: PRODUCT_STATUS.APPROVED });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PRODUCT_STATUS.APPROVED);
    expect(res.body.data.isActive).toBe(true);

    const list = await request(app).get('/api/v1/products');
    expect(list.body.data).toHaveLength(1);
  });

  it('refuses a seller (admin only)', async () => {
    const { seller, shop } = await helpers.createSeller();
    const product = await helpers.createProduct({ seller, shop });

    const res = await request(app)
      .put(`/api/v1/products/${product._id}/moderate`)
      .set(helpers.authHeader(seller))
      .send({ status: PRODUCT_STATUS.APPROVED });

    expect(res.status).toBe(403);
  });
});

describe('PUT / DELETE /api/v1/products/:id (seller)', () => {
  it('sends an approved product back to review after a price change', async () => {
    const { seller, shop } = await helpers.createSeller();
    const product = await helpers.createProduct({ seller, shop, price: 100 });

    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set(helpers.authHeader(seller))
      .send({ price: 130 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PRODUCT_STATUS.PENDING);
  });

  it('refuses to edit a product of another seller', async () => {
    const first = await helpers.createProduct();
    const stranger = await helpers.createSeller(); // a different seller

    const res = await request(app)
      .put(`/api/v1/products/${first._id}`)
      .set(helpers.authHeader(stranger.seller))
      .send({ price: 999 });

    expect(res.status).toBe(403);
  });

  it('deletes a product', async () => {
    const { seller, shop } = await helpers.createSeller();
    const product = await helpers.createProduct({ seller, shop });

    const res = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set(helpers.authHeader(seller));

    expect(res.status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
  });
});
