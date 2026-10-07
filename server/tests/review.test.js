/**
 * tests/review.test.js
 * ---------------------------------------------------------
 * Product / shop reviews + the automatic average rating.
 */
const request = require('supertest');
const app = require('../src/app');
const helpers = require('./helpers/db');
const { Review, Product, Shop } = require('../src/models');

beforeAll(async () => {
  await helpers.connect();
});

afterEach(async () => {
  await helpers.clearDatabase();
});

afterAll(async () => {
  await helpers.closeDatabase();
});

describe('POST /api/v1/reviews', () => {
  it('requires authentication', async () => {
    const product = await helpers.createProduct();
    const res = await request(app)
      .post('/api/v1/reviews')
      .send({ product: product._id, rating: 5 });

    expect(res.status).toBe(401);
  });

  it('creates a review and updates the product rating', async () => {
    const customer = await helpers.createUser();
    const product = await helpers.createProduct();

    const res = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 5, comment: 'Excellent serum!' });

    expect(res.status).toBe(201);
    expect(res.body.data.review.rating).toBe(5);

    const updated = await Product.findById(product._id);
    expect(updated.rating).toBe(5);
    expect(updated.numReviews).toBe(1);

    // the shop rating was calculated too
    const shop = await Shop.findById(product.shop);
    expect(shop.numReviews).toBe(1);
  });

  it('updates the existing review instead of creating a second one', async () => {
    const customer = await helpers.createUser();
    const product = await helpers.createProduct();

    await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 5 });

    const second = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 3, comment: 'Changed my mind' });

    expect(second.status).toBe(200);
    expect(second.body.data.review.rating).toBe(3);
    expect(await Review.countDocuments({ product: product._id })).toBe(1);

    const updated = await Product.findById(product._id);
    expect(updated.rating).toBe(3);
  });

  it('validates the rating value', async () => {
    const customer = await helpers.createUser();
    const product = await helpers.createProduct();

    const res = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 9 });

    expect(res.status).toBe(422);
  });

  it('refuses a review without any target', async () => {
    const customer = await helpers.createUser();

    const res = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ rating: 4 });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/reviews', () => {
  it('lists the reviews of a product (public)', async () => {
    const customer = await helpers.createUser({ name: 'Sara Ahmad' });
    const product = await helpers.createProduct();

    await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 4, comment: 'Very good' });

    const res = await request(app).get(`/api/v1/reviews/product/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].comment).toBe('Very good');
    expect(res.body.data[0].user.name).toBe('Sara Ahmad');
  });

  it('reviews a shop directly', async () => {
    const customer = await helpers.createUser();
    const { shop } = await helpers.createSeller();

    const res = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ shop: shop._id, rating: 5, comment: 'The salon was very clean' });

    expect(res.status).toBe(201);
    expect(res.body.data.ratings.shop.avgRating).toBe(5);
  });
});

describe('PUT / DELETE /api/v1/reviews/:id', () => {
  it('lets the owner edit his review', async () => {
    const customer = await helpers.createUser();
    const product = await helpers.createProduct();

    const created = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 5 });

    const res = await request(app)
      .put(`/api/v1/reviews/${created.body.data.review._id}`)
      .set(helpers.authHeader(customer))
      .send({ rating: 2, comment: 'Actually it broke after two days' });

    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(2);
  });

  it('refuses another user', async () => {
    const owner = await helpers.createUser({ email: 'owner@test.com' });
    const product = await helpers.createProduct();
    const other = await helpers.createUser({ email: 'other@test.com' });

    const created = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(owner))
      .send({ product: product._id, rating: 5 });

    const res = await request(app)
      .put(`/api/v1/reviews/${created.body.data.review._id}`)
      .set(helpers.authHeader(other))
      .send({ rating: 1 });

    expect(res.status).toBe(403);
  });

  it('deletes the review and resets the rating', async () => {
    const customer = await helpers.createUser();
    const product = await helpers.createProduct();

    const created = await request(app)
      .post('/api/v1/reviews')
      .set(helpers.authHeader(customer))
      .send({ product: product._id, rating: 5 });

    const res = await request(app)
      .delete(`/api/v1/reviews/${created.body.data.review._id}`)
      .set(helpers.authHeader(customer));

    expect(res.status).toBe(200);

    const updated = await Product.findById(product._id);
    expect(updated.rating).toBe(0);
    expect(updated.numReviews).toBe(0);
  });
});
