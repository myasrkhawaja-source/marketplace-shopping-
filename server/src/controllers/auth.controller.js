/**
 * controllers/auth.controller.js
 * ---------------------------------------------------------
 * register / login / logout / me / change password
 */
const User = require('../models/User');
const Shop = require('../models/Shop');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const { signToken, cookieOptions } = require('../utils/token');
const { ROLES, SHOP_STATUS } = require('../config/constants');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Create an account (customer by default, or a seller + pending shop)
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone = '', role, shopName, city = '' } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw ApiError.conflict('This email is already registered, please log in');

  // Nobody can self-register as admin (only an existing admin can promote a user)
  const finalRole = role === ROLES.SELLER ? ROLES.SELLER : ROLES.CUSTOMER;

  const user = await User.create({ name, email, password, phone, role: finalRole });

  let shop = null;
  if (finalRole === ROLES.SELLER) {
    shop = await Shop.create({
      owner: user._id,
      name: shopName || `${name}'s Beauty Store`,
      city,
      status: SHOP_STATUS.PENDING, // waiting for the admin approval
    });
  }

  const token = signToken(user);
  res.cookie('token', token, cookieOptions());

  return sendCreated(
    res,
    { user: user.toPublic(), shop, token },
    finalRole === ROLES.SELLER
      ? 'Seller account created. Your shop is waiting for the admin approval.'
      : 'Your account has been created successfully'
  );
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Log in with email + password
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false in the model, so ask for it explicitly
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Email or password is incorrect');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Email or password is incorrect');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated by the admin');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const shop = user.role === ROLES.SELLER ? await Shop.findOne({ owner: user._id }) : null;
  const token = signToken(user);
  res.cookie('token', token, cookieOptions());

  return sendSuccess(res, { user: user.toPublic(), shop, token }, `Welcome back, ${user.name}!`);
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear the auth cookie
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', cookieOptions());
  return sendSuccess(res, null, 'You have been logged out');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Current user + his shop (used by the React AuthContext)
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const shop = req.user.role === ROLES.SELLER ? await Shop.findOne({ owner: req.user._id }) : null;
  return sendSuccess(res, { user: req.user.toPublic(), shop }, 'Current user');
});

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change the password (requires the current one)
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Your current password is incorrect');

  user.password = newPassword;
  await user.save();

  const token = signToken(user); // old tokens are invalidated by passwordChangedAt
  res.cookie('token', token, cookieOptions());

  return sendSuccess(res, { token }, 'Password updated successfully');
});

module.exports = { register, login, logout, getMe, updatePassword };
