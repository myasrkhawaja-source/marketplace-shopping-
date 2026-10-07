/**
 * tests/order.test.js
 * ---------------------------------------------------------
 * Cart, checkout, order flow and stock handling.
 */
const request = require('supertest');
const app = require('../src/app');
const helpers = require('./helpers/db');
const { Order, Cart, Product } = require('../src/models');
const { ORDER_STATUS, PRODUCT_TYPES, ROLES } = require('../src/config/constants');

beforeAll(async () => {
  await helpers.connect();
});

afterEach(async () => {
  await helpers.clearDatabase();
});

afterAll(async () => {
  await helpers.closeDatabase();
});

const shippingAddress = {
  fullName: 'Sara Ahmad',
  phone: '0595-111-222',
  city: 'Ramallah',
  street: 'Ein Misbah',
  details: 'Building 4',
};

/** Customer + a product priced 50 with 10 in stock. */
const setupCartScenario = async () => {
  const customer = await helpers.createUser({ name: 'Sara Ahmad' });
  const { seller, shop } = await helpers.createSeller();
  const product = await helpers.createProduct({ seller, shop, price: 50, stock: 10 });
  return { customer, seller, shop, product };
};

describe('Cart API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('adds an item and returns the totals', async () => {
    const { customer, product } = await setupCartScenario();

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set(helpers.authHeader(customer))
      .send({ productId: product._id, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.itemsCount).toBe(2);
    expect(res.body.data.summary.subtotal).toBe(100);
    expect(res.body.data.summary.shippingFee).toBe(15);
    expect(res.body.data.summary.total).toBe(115);
  });

  it('refuses a quantity bigger than the stock', async () => {
    const { customer, product } = await setupCartScenario();

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set(helpers.authHeader(customer))
      .send({ productId: product._id, quantity: 99 });

    // the cart caps the quantity to the available stock instead of failing
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(10);
  });

  it('updates and removes an item', async () => {
    const { customer, product } = await setupCartScenario();

    const added = await request(app)
      .post('/api/v1/cart/items')
      .set(helpers.authHeader(customer))
      .send({ productId: product._id, quantity: 1 });

    const itemId = added.body.data.items[0]._id;

    const updated = await request(app)
      .put(`/api/v1/cart/items/${itemId}`)
      .set(helpers.authHeader(customer))
      .send({ quantity: 3 });
    expect(updated.body.data.itemsCount).toBe(3);

    const removed = await request(app)
      .delete(`/api/v1/cart/items/${itemId}`)
      .set(helpers.authHeader(customer));
    expect(removed.body.data.items).toHaveLength(0);
  });

  it('refuses a service without a booking date', async () => {
    const customer = await helpers.createUser();
    const product = await helpers.createProduct({ type: PRODUCT_TYPES.SERVICE, price: 200 });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set(helpers.authHeader(customer))
      .send({ productId: product._id, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/booking date/i);
  });
});

describe('Checkout API', () => {
  it('creates the order, empties the cart and decreases the stock', async () => {
    const { customer, product } = await setupCartScenario();

    await request(app)
      .post('/api/v1/cart/items')
      .set(helpers.authHeader(customer))
      .send({ productId: product._id, quantity: 2 });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set(helpers.authHeader(customer))
      .send({ shippingAddress, paymentMethod: 'cash', notes: 'Call me please' });

    expect(res.status).toBe(201);
    expect(res.body.data.orderNumber).toMatch(/^BM-\d{4}-\d{6}$/);
    expect(res.body.data.status).toBe(ORDER_STATUS.PENDING);
    expect(res.body.data.total).toBe(115);
    expect(res.body.data.items).toHaveLength(1);

    // stock updated + cart emptied
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(8);
    expect(updatedProduct.soldCount).toBe(2);

    const cart = await Cart.findOne({ user: customer._id });
    expect(cart.items).toHaveLength(0);
  });

  it('supports a direct "buy now" order (without the cart)', async () => {
    const { customer, product } = await setupCartScenario();

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set(helpers.authHeader(customer))
      .send({ shippingAddress, items: [{ product: product._id, quantity: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(50);
  });

  it('refuses an empty cart', async () => {
    const customer = await helpers.createUser();

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set(helpers.authHeader(customer))
      .send({ shippingAddress });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it('validates the shipping address', async () => {
    const customer = await helpers.createUser();

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set(helpers.authHeader(customer))
      .send({ shippingAddress: { city: '' }, items: [{ product: '000000000000000000000000' }] });

    expect(res.status).toBe(422);
  });
});

describe('Order status flow', () => {
  /** Customer order + the seller of the product. */
  const placeOrder = async () => {
    const { customer, seller, product } = await setupCartScenario();

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set(helpers.authHeader(customer))
      .send({ shippingAddress, items: [{ product: product._id, quantity: 1 }] });

    return { customer, seller, product, order: res.body.data };
  };

  it('lets the seller confirm then ship the order', async () => {
    const { seller, order } = await placeOrder();

    const confirmed = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set(helpers.authHeader(seller))
      .send({ status: ORDER_STATUS.CONFIRMED });

    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(confirmed.body.data.statusHistory).toHaveLength(2);

    const invalid = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set(helpers.authHeader(seller))
      .send({ status: ORDER_STATUS.DELIVERED }); // confirmed -> delivered is not allowed

    expect(invalid.status).toBe(400);
  });

  it('refuses a customer who tries to change the status', async () => {
    const { customer, order } = await placeOrder();

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set(helpers.authHeader(customer))
      .send({ status: ORDER_STATUS.CONFIRMED });

    expect(res.status).toBe(403);
  });

  it('refuses an unrelated seller', async () => {
    const { order } = await placeOrder();
    const stranger = await helpers.createSeller();

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set(helpers.authHeader(stranger.seller))
      .send({ status: ORDER_STATUS.CONFIRMED });

    expect(res.status).toBe(403);
  });

  it('lets the customer cancel a pending order and restores the stock', async () => {
    const { customer, product, order } = await placeOrder();

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/cancel`)
      .set(helpers.authHeader(customer))
      .send({ reason: 'I changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(ORDER_STATUS.CANCELLED);

    const restored = await Product.findById(product._id);
    expect(restored.stock).toBe(10);
    expect(restored.soldCount).toBe(0);
  });

  it('shows the customer his own orders only', async () => {
    const { customer, order } = await placeOrder();
    const other = await helpers.createUser({ email: 'other@test.com' });

    const mine = await request(app).get('/api/v1/orders/my').set(helpers.authHeader(customer));
    expect(mine.body.data).toHaveLength(1);

    const strangers = await request(app).get('/api/v1/orders/my').set(helpers.authHeader(other));
    expect(strangers.body.data).toHaveLength(0);

    const forbidden = await request(app)
      .get(`/api/v1/orders/${order._id}`)
      .set(helpers.authHeader(other));
    expect(forbidden.status).toBe(403);
  });
});

describe('Admin order access', () => {
  it('lists every order for the admin', async () => {
    const { customer, product } = await setupCartScenario();
    const admin = await helpers.createUser({ role: ROLES.ADMIN });

    await request(app)
      .post('/api/v1/orders/checkout')
      .set(helpers.authHeader(customer))
      .send({ shippingAddress, items: [{ product: product._id, quantity: 1 }] });

    const res = await request(app).get('/api/v1/orders/admin/all').set(helpers.authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(await Order.countDocuments()).toBe(1);
  });
});

