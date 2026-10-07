/**
 * validators/order.validator.js
 * ---------------------------------------------------------
 * Validation for checkout, ordering and status updates.
 */
const { body, param } = require('express-validator');
const { ORDER_STATUS, PAYMENT_METHODS } = require('../config/constants');

const checkoutRules = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').trim().isLength({ min: 7, max: 20 }).withMessage('A valid phone number is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.street').optional({ values: 'falsy' }).trim(),
  body('shippingAddress.details').optional({ values: 'falsy' }).trim(),
  body('paymentMethod')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage('Payment method must be cash or card'),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  // Direct "buy now" flow (skips the cart)
  body('items').optional().isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product').optional().isMongoId().withMessage('Invalid product id inside the items'),
  body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.bookingDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid booking date'),
];

const updateStatusRules = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status').isIn(Object.values(ORDER_STATUS)).withMessage('Invalid order status'),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
];

const cancelRules = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
];

module.exports = { checkoutRules, updateStatusRules, cancelRules };
