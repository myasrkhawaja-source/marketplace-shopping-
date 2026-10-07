/**
 * routes/dashboard.routes.js
 * ---------------------------------------------------------
 * /api/v1/dashboard
 */
const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect, authorize, attachShop } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/seller', authorize(ROLES.SELLER), attachShop, dashboardController.getSellerStats);
router.get('/admin', authorize(ROLES.ADMIN), dashboardController.getAdminStats);
router.get('/customer', dashboardController.getCustomerStats);

module.exports = router;
