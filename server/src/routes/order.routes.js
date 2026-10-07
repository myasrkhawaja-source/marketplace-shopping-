/**
 * routes/order.routes.js
 * ---------------------------------------------------------
 * /api/v1/orders
 */
const express = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const { protect, authorize, attachShop } = require('../middlewares/auth');
const { checkoutRules, updateStatusRules, cancelRules } = require('../validators/order.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

/* ---------------- Customer ---------------- */
router.post(
  '/checkout',
  authorize(ROLES.CUSTOMER, ROLES.SELLER),
  validate(checkoutRules),
  orderController.checkout
);
router.get('/my', orderController.getMyOrders);
router.put('/:id/cancel', authorize(ROLES.CUSTOMER, ROLES.SELLER), validate(cancelRules), orderController.cancelMyOrder);

/* ---------------- Seller ---------------- */
router.get('/seller/my', authorize(ROLES.SELLER), attachShop, orderController.getSellerOrders);
router.get('/seller/booking', authorize(ROLES.SELLER), attachShop, orderController.getSellerBookings);

/* ---------------- Admin ---------------- */
router.get('/admin/all', authorize(ROLES.ADMIN), orderController.adminListOrders);
router.put('/:id/payment', authorize(ROLES.ADMIN), orderController.updatePaymentStatus);
router.delete('/:id', authorize(ROLES.ADMIN), orderController.deleteOrder);

/* ---------------- Shared ---------------- */
router.put(
  '/:id/status',
  authorize(ROLES.SELLER, ROLES.ADMIN),
  validate(updateStatusRules),
  orderController.updateOrderStatus
);

/* ---------------- Details (keep last) ---------------- */
router.get('/:id', orderController.getOrderById);

module.exports = router;
