/**
 * validators/review.validator.js
 * ---------------------------------------------------------
 * Validation for product / shop reviews.
 */
const { body, param } = require('express-validator');

const upsertReviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5').toInt(),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 800 }),
  body('product').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid product id'),
  body('shop').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid shop id'),
  body().custom((value) => {
    if (!value.product && !value.shop) throw new Error('Please review a product and/or a shop');
    return true;
  }),
];

const updateReviewRules = [
  param('id').isMongoId().withMessage('Invalid review id'),
  body('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 800 }),
];

const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { upsertReviewRules, updateReviewRules, idParamRule };
