/**
 * validators/auth.validator.js
 * ---------------------------------------------------------
 * express-validator chains for the authentication endpoints.
 */
const { body } = require('express-validator');
const { ROLES } = require('../config/constants');

const password = (field = 'password') =>
  body(field)
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long');

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Please enter your full name'),
  body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  password(),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Phone is too long'),
  body('role')
    .optional()
    .isIn([ROLES.CUSTOMER, ROLES.SELLER])
    .withMessage('You can only register as a customer or a seller'),
  body('shopName')
    .if(body('role').equals(ROLES.SELLER))
    .trim()
    .isLength({ min: 3, max: 80 })
    .withMessage('Sellers must provide a shop name (3+ characters)'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updatePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  password('newPassword'),
];

const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name is invalid'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  body('avatar').optional({ values: 'falsy' }).trim().isString(),
];

const addressRules = [
  body('city').trim().notEmpty().withMessage('City is required'),
  body('fullName').optional({ values: 'falsy' }).trim(),
  body('phone').optional({ values: 'falsy' }).trim(),
  body('street').optional({ values: 'falsy' }).trim(),
  body('details').optional({ values: 'falsy' }).trim(),
  body('label').optional({ values: 'falsy' }).trim(),
  body('isDefault').optional().isBoolean().toBoolean(),
];

module.exports = {
  registerRules,
  loginRules,
  updatePasswordRules,
  updateProfileRules,
  addressRules,
};
