/**
 * validators/shop.validator.js
 * ---------------------------------------------------------
 * Validation for the seller shop profile + admin moderation.
 */
const { body, param } = require('express-validator');
const { SHOP_STATUS } = require('../config/constants');

const createShopRules = [
  body('name').trim().isLength({ min: 3, max: 80 }).withMessage('Shop name must be 3-80 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1200 }),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  body('whatsapp').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  body('instagram').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('website').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
  body('openHours').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('logo').optional({ values: 'falsy' }).trim(),
  body('cover').optional({ values: 'falsy' }).trim(),
];

const updateShopRules = [
  body('name').optional().trim().isLength({ min: 3, max: 80 }),
  ...createShopRules.slice(1),
];

const moderateShopRules = [
  param('id').isMongoId().withMessage('Invalid shop id'),
  body('status')
    .isIn([SHOP_STATUS.APPROVED, SHOP_STATUS.REJECTED, SHOP_STATUS.SUSPENDED])
    .withMessage('Status must be approved, rejected or suspended'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
];

const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { createShopRules, updateShopRules, moderateShopRules, idParamRule };
