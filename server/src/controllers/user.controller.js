/**
 * controllers/user.controller.js
 * ---------------------------------------------------------
 * Profile, addresses, favourites + the admin section for users.
 */
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');
const { buildPaginationMeta } = require('../utils/helpers');
const { filesToUrls } = require('../middlewares/upload');
const { ROLES } = require('../config/constants');

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update name / phone / avatar
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  return sendSuccess(res, user.toPublic(), 'Profile updated successfully');
});

/**
 * @route   POST /api/v1/users/me/avatar
 * @desc    Upload a profile picture (multipart/form-data, field: avatar)
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  const urls = filesToUrls(req);
  if (!urls.length) throw ApiError.badRequest('Please choose an image to upload');

  const user = await User.findByIdAndUpdate(req.user._id, { avatar: urls[0] }, { new: true });
  return sendSuccess(res, user.toPublic(), 'Profile picture updated');
});

/* ------------------------------------------------------------------ */
/*  Addresses                                                          */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/users/me/addresses
 * @access  Private
 */
const listAddresses = asyncHandler(async (req, res) =>
  sendSuccess(res, req.user.addresses, 'Addresses')
);

/**
 * @route   POST /api/v1/users/me/addresses
 * @access  Private
 */
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 10) throw ApiError.badRequest('You can save up to 10 addresses');

  const address = req.body;
  if (address.isDefault) user.addresses.forEach((item) => { item.isDefault = false; });
  if (user.addresses.length === 0) address.isDefault = true; // first one becomes the default

  user.addresses.push(address);
  await user.save();

  return sendCreated(res, user.addresses, 'Address added');
});

/**
 * @route   PUT /api/v1/users/me/addresses/:addressId
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  const fields = ['label', 'fullName', 'phone', 'city', 'street', 'details', 'isDefault'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) address[field] = req.body[field];
  });

  if (req.body.isDefault) {
    user.addresses.forEach((item) => {
      item.isDefault = String(item._id) === String(address._id);
    });
  }

  await user.save();
  return sendSuccess(res, user.addresses, 'Address updated');
});

/**
 * @route   DELETE /api/v1/users/me/addresses/:addressId
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  address.deleteOne();
  if (!user.addresses.some((item) => item.isDefault) && user.addresses.length) {
    user.addresses[0].isDefault = true;
  }
  await user.save();

  return sendSuccess(res, user.addresses, 'Address deleted');
});

/* ------------------------------------------------------------------ */
/*  Favourites (wish list)                                             */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/users/me/favorites
 * @access  Private
 */
const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    select: 'name slug images price discountPrice rating numReviews type stock',
    populate: { path: 'shop', select: 'name slug' },
  });
  return sendSuccess(res, user.favorites, 'Favourite products');
});

/**
 * @route   POST /api/v1/users/me/favorites/:productId
 * @desc    Add / remove a product from the wish list (toggle)
 * @access  Private
 */
const toggleFavorite = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('_id');
  if (!product) throw ApiError.notFound('Product not found');

  const user = await User.findById(req.user._id);
  const exists = user.favorites.some((id) => String(id) === String(product._id));

  if (exists) user.favorites.pull(product._id);
  else user.favorites.push(product._id);
  await user.save();

  return sendSuccess(
    res,
    { isFavorite: !exists, favorites: user.favorites },
    exists ? 'Removed from your wish list' : 'Added to your wish list'
  );
});

/* ------------------------------------------------------------------ */
/*  Admin section                                                      */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/users            (Admin)
 * @desc    Paginated users list with search + role filter
 */
const listUsers = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(User.find(), req.query)
    .search(['name', 'email', 'phone'])
    .filter(['role', 'isActive'])
    .sort('-createdAt')
    .paginate();

  const [users, total] = await Promise.all([
    features.query.select('-password'),
    User.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, users, buildPaginationMeta(features.page, features.limit, total), 'Users list');
});

/**
 * @route   GET /api/v1/users/:id        (Admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const shop = user.role === ROLES.SELLER ? await Shop.findOne({ owner: user._id }) : null;
  return sendSuccess(res, { user: user.toPublic(), shop }, 'User details');
});

/**
 * @route   PUT /api/v1/users/:id        (Admin)
 * @desc    Change a role or (de)activate an account
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Never let an admin lock himself out
  if (String(user._id) === String(req.user._id) && (req.body.role || req.body.isActive === false)) {
    throw ApiError.badRequest('You cannot change your own role or deactivate your own account');
  }

  const previousRole = user.role;
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  await user.save();

  // Promote a customer to seller without a shop? create a pending one
  if (previousRole !== ROLES.SELLER && user.role === ROLES.SELLER) {
    const exists = await Shop.findOne({ owner: user._id });
    if (!exists) {
      await Shop.create({
        owner: user._id,
        name: `${user.name}'s Beauty Store`,
        status: 'pending',
      });
    }
  }

  return sendSuccess(res, user.toPublic(), 'User updated successfully');
});

/**
 * @route   DELETE /api/v1/users/:id     (Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Cleanup the related shop + products
  await Shop.deleteOne({ owner: user._id });
  await Product.deleteMany({ seller: user._id });

  return sendSuccess(res, { _id: user._id }, 'User deleted successfully');
});

module.exports = {
  updateProfile,
  uploadAvatar,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listFavorites,
  toggleFavorite,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
