/**
 * middlewares/auth.js
 * ---------------------------------------------------------
 * Authentication + authorisation guards.
 *
 *   protect                     -> must be logged in
 *   authorize('admin')          -> role based access
 *   attachShop                  -> seller must have a shop (req.shop)
 *   requireApprovedShop         -> shop approved by the admin
 *   optionalAuth                -> logged in? attach user, otherwise continue
 */
const User = require('../models/User');
const Shop = require('../models/Shop');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');
const { ROLES, SHOP_STATUS } = require('../config/constants');

/** Pull the JWT from the Authorization header or from the cookie. */
const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.split(' ')[1];
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
};

/** Require a valid token and load the current user on `req.user`. */
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Please log in to continue');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Your session expired, please log in again' : 'Invalid token'
    );
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('The account linked to this token no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated by the admin');
  if (user.changedPasswordAfter(payload.iat)) {
    throw ApiError.unauthorized('Password changed recently, please log in again');
  }

  req.user = user;
  return next();
});

/** Same as protect but never throws when the visitor is anonymous. */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // silently ignore an invalid token for public endpoints
  }
  return next();
});

/** Restrict a route to the given roles: authorize(ROLES.ADMIN, ROLES.SELLER). */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action requires one of these roles: ${roles.join(', ')}`));
  }
  return next();
};

/** Load the shop of the logged-in seller into `req.shop`. */
const attachShop = asyncHandler(async (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role === ROLES.ADMIN) return next(); // admin can act on behalf of any shop

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    throw ApiError.notFound('You do not have a shop yet, please create one first');
  }
  req.shop = shop;
  return next();
});

/** The shop must be approved before managing the catalogue. */
const requireApprovedShop = (req, res, next) => {
  if (req.user?.role === ROLES.ADMIN) return next();
  if (!req.shop) return next(ApiError.forbidden('Shop not found'));
  if (req.shop.status !== SHOP_STATUS.APPROVED) {
    return next(
      ApiError.forbidden(
        req.shop.status === SHOP_STATUS.PENDING
          ? 'Your shop is still waiting for the admin approval'
          : `Your shop is ${req.shop.status} and cannot add products right now`
      )
    );
  }
  return next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  attachShop,
  requireApprovedShop,
  extractToken,
};
