/**
 * routes/index.js
 * ---------------------------------------------------------
 * The API surface of the whole backend (v1).
 *
 *   /api/v1/auth        register / login / me
 *   /api/v1/users       profiles, addresses, wish list, admin users
 *   /api/v1/shops       beauty stores & salons
 *   /api/v1/products    products + services (catalogue & seller CRUD)
 *   /api/v1/categories  categories
 *   /api/v1/cart        server side cart
 *   /api/v1/orders      checkout, orders, bookings
 *   /api/v1/reviews     ratings & comments
 *   /api/v1/dashboard   statistics
 */
const express = require('express');

const router = express.Router();

const routes = [
  { path: '/auth', module: './auth.routes' },
  { path: '/users', module: './user.routes' },
  { path: '/shops', module: './shop.routes' },
  { path: '/products', module: './product.routes' },
  { path: '/categories', module: './category.routes' },
  { path: '/cart', module: './cart.routes' },
  { path: '/orders', module: './order.routes' },
  { path: '/reviews', module: './review.routes' },
  { path: '/dashboard', module: './dashboard.routes' },
];

// Health check (useful for monitoring + the client status badge)
router.get('/health', (req, res) =>
  res.json({
    success: true,
    message: 'Beauty Marketplace API is running 🚀',
    data: {
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  })
);

routes.forEach((route) => router.use(route.path, require(route.module)));

module.exports = router;
