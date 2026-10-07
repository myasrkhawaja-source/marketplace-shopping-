/**
 * validators/product.validator.js
 * ---------------------------------------------------------
 * Validation rules for creating / updating products & services.
 */
const { body, param } = require('express-validator');
const { PRODUCT_TYPES, PRODUCT_STATUS } = require('../config/constants');

const createProductRules = [
  body('name').trim().isLength({ min: 3, max: 120 }).withMessage('Product name must be 3-120 characters'),
  body('description').trim().isLength({ min: 10, max: 3000 }).withMessage('Description must be at least 10 characters'),
  body('shortDescription').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('discountPrice')
    .optional({ values: 'null' })
    .custom((value) => value === '' || value === null || Number(value) >= 0)
    .withMessage('Discount price must be a positive number'),
  body('category').isMongoId().withMessage('Please choose a valid category'),
  body('type').optional().isIn(Object.values(PRODUCT_TYPES)).withMessage('Type must be product or service'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more').toInt(),
  body('durationMinutes').optional().isInt({ min: 15, max: 720 }).withMessage('Duration must be 15-720 minutes').toInt(),
  body('images').optional().customSanitizer((value) => (Array.isArray(value) ? value : [value])),
  body('tags').optional().customSanitizer((value) => (Array.isArray(value) ? value : String(value).split(',').map((t) => t.trim()).filter(Boolean))),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  body('brand').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  body('isActive').optional().isBoolean().toBoolean(),
  body('status').optional().isIn(Object.values(PRODUCT_STATUS)).withMessage('Invalid status'),
];

const updateProductRules = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('name').optional().trim().isLength({ min: 3, max: 120 }),
  body('description').optional().trim().isLength({ min: 10, max: 3000 }),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('discountPrice').optional({ values: 'null' }).custom((value) => value === '' || value === null || Number(value) >= 0),
  body('category').optional().isMongoId().withMessage('Invalid category'),
  body('type').optional().isIn(Object.values(PRODUCT_TYPES)),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('durationMinutes').optional().isInt({ min: 15, max: 720 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { createProductRules, updateProductRules, idParamRule };
