/**
 * validators/category.validator.js
 * ---------------------------------------------------------
 * Validation for the admin-managed categories.
 */
const { body, param } = require('express-validator');
const { PRODUCT_TYPES } = require('../config/constants');

const createCategoryRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Category name must be 2-50 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('image').optional({ values: 'falsy' }).trim(),
  body('icon').optional({ values: 'falsy' }).trim().isLength({ max: 8 }),
  body('kind').optional().isIn([PRODUCT_TYPES.PRODUCT, PRODUCT_TYPES.SERVICE, 'both']).withMessage('Kind must be product, service or both'),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const updateCategoryRules = [
  param('id').isMongoId().withMessage('Invalid category id'),
  ...createCategoryRules.map((rule) => rule.optional({ values: 'undefined' })),
];

const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { createCategoryRules, updateCategoryRules, idParamRule };
