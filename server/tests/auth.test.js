/**
 * tests/auth.test.js
 * ---------------------------------------------------------
 * Authentication & accounts:
 * register (customer / seller), login, me, change password.
 */
const request = require('supertest');
const app = require('../src/app');
const helpers = require('./helpers/db');
const { User, Shop } = require('../src/models');
const { ROLES, SHOP_STATUS } = require('../src/config/constants');

beforeAll(async () => {
  await helpers.connect();
});

afterEach(async () => {
  await helpers.clearDatabase();
});

afterAll(async () => {
  await helpers.closeDatabase();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a customer account and returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Sara Ahmad',
      email: 'sara@test.com',
      password: 'password123',
      phone: '0595-111-222',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe(ROLES.CUSTOMER);
    expect(res.body.data.user.password).toBeUndefined();

    const user = await User.findOne({ email: 'sara@test.com' });
    expect(user.password).not.toBe('password123'); // hashed
  });

  it('creates a seller account together with a pending shop', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Layla Hassan',
      email: 'layla@test.com',
      password: 'password123',
      role: ROLES.SELLER,
      shopName: 'Glow Beauty Store',
      city: 'Ramallah',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(ROLES.SELLER);
    expect(res.body.data.shop.status).toBe(SHOP_STATUS.PENDING);

    const shop = await Shop.findOne({ name: 'Glow Beauty Store' });
    expect(shop).toBeTruthy();
    expect(shop.slug).toBeTruthy();
  });

  it('refuses an admin self registration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Hacker',
      email: 'hacker@test.com',
      password: 'password123',
      role: ROLES.ADMIN,
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid email and a short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Bad Data',
      email: 'not-an-email',
      password: '123',
    });

    expect(res.status).toBe(422);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a duplicated email', async () => {
    await helpers.createUser({ email: 'dupe@test.com' });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Another User',
      email: 'dupe@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with the right credentials', async () => {
    await helpers.createUser({ email: 'login@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('login@test.com');
  });

  it('refuses a wrong password', async () => {
    await helpers.createUser({ email: 'wrong@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@test.com', password: 'not-the-password' });

    expect(res.status).toBe(401);
  });

  it('refuses a deactivated account', async () => {
    const user = await helpers.createUser({ email: 'off@test.com', password: 'password123' });
    user.isActive = false;
    await user.save();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'off@test.com', password: 'password123' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const user = await helpers.createUser({ email: 'me@test.com' });

    const res = await request(app).get('/api/v1/auth/me').set(helpers.authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@test.com');
  });

  it('refuses a request without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/auth/password', () => {
  it('changes the password and invalidates the old token', async () => {
    const user = await helpers.createUser({ email: 'change@test.com', password: 'password123' });
    const oldToken = helpers.authHeader(user);

    // the JWT `iat` has a 1 second resolution: wait so the new password
    // is really "newer" than the token that was already issued
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await request(app).put('/api/v1/auth/password').set(oldToken).send({
      currentPassword: 'password123',
      newPassword: 'newPassword456',
    });
    expect(res.status).toBe(200);

    // the new password works
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'change@test.com', password: 'newPassword456' });
    expect(login.status).toBe(200);

    // the old token is rejected
    const me = await request(app).get('/api/v1/auth/me').set(oldToken);
    expect(me.status).toBe(401);
  });

  it('refuses a wrong current password', async () => {
    const user = await helpers.createUser({ email: 'wrongpw@test.com', password: 'password123' });

    const res = await request(app)
      .put('/api/v1/auth/password')
      .set(helpers.authHeader(user))
      .send({ currentPassword: 'nope-nope', newPassword: 'newPassword456' });

    expect(res.status).toBe(400);
  });
});
