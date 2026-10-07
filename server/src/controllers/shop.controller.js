/**
 * controllers/shop.controller.js
 * ---------------------------------------------------------
 * Seller storefronts: public browsing, seller profile management
 * and the admin approval workflow.
 */
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');
const { buildPaginationMeta } = require('../utils/helpers');
const { filesToUrls } = require('../middlewares/upload');
const {
  SHOP_STATUS,
  PRODUCT_STATUS,
  ORDER_STATUS,
} = require('../config/constants');

/* ------------------------------------------------------------------ */
/*  Public browsing                                                    */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/shops?search=&city=&category=&sort=
 * @desc    Approved shops only
 * @access  Public
 */
const listShops = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(Shop.find({ status: SHOP_STATUS.APPROVED }), req.query)
    .search(['name', 'description', 'city'])
    .filter(['city', 'category'])
    .sort('-rating')
    .paginate();

  const [shops, total] = await Promise.all([
    features.query,
    Shop.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, shops, buildPaginationMeta(features.page, features.limit, total), 'Beauty shops');
});

/**
 * @route   GET /api/v1/shops/:slug
 * @desc    One shop + its approved products and services
 * @access  Public
 */
const getShopBySlug = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ slug: req.params.slug }).populate(
    'owner',
    'name email avatar createdAt'
  );
  if (!shop) throw ApiError.notFound('Shop not found');

  const products = await Product.find({
    shop: shop._id,
    status: PRODUCT_STATUS.APPROVED,
    isActive: true,
  })
    .populate('category', 'name slug')
    .sort('-createdAt');

  return sendSuccess(res, { shop, products }, 'Shop details');
});

/* ------------------------------------------------------------------ */
/*  Seller area                                                        */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/shops/me
 * @access  Private (seller)
 */
const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) throw ApiError.notFound('You do not have a shop yet');
  return sendSuccess(res, shop, 'My shop');
});

/**
 * @route   POST /api/v1/shops
 * @desc    Create the shop of the logged-in seller (created at registration too)
 * @access  Private (seller)
 */
const createShop = asyncHandler(async (req, res) => {
  const existing = await Shop.findOne({ owner: req.user._id });
  if (existing) throw ApiError.conflict('You already have a shop');

  const shop = await Shop.create({
    ...req.body,
    owner: req.user._id,
    status: SHOP_STATUS.PENDING,
  });
  return sendCreated(res, shop, 'Shop created, waiting for the admin approval');
});

/**
 * @route   PUT /api/v1/shops/me
 * @access  Private (seller)
 */
const updateMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) throw ApiError.notFound('You do not have a shop yet');

  const editable = [
    'name', 'description', 'category', 'city', 'address', 'phone', 'whatsapp',
    'instagram', 'website', 'openHours', 'logo', 'cover',
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) shop[field] = req.body[field];
  });

  await shop.save();
  return sendSuccess(res, shop, 'Shop updated successfully');
});

/**
 * @route   POST /api/v1/shops/me/media
 * @desc    Upload the shop logo / cover (multipart: logo, cover)
 * @access  Private (seller)
 */
const uploadShopMedia = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) throw ApiError.notFound('You do not have a shop yet');

  if (req.files?.logo?.[0]) {
    shop.logo = filesToUrls({ ...req, files: [req.files.logo[0]] })[0];
  }
  if (req.files?.cover?.[0]) {
    shop.cover = filesToUrls({ ...req, files: [req.files.cover[0]] })[0];
  }
  if (!req.files?.logo && !req.files?.cover) {
    throw ApiError.badRequest('Please upload a logo and/or a cover image');
  }

  await shop.save();
  return sendSuccess(res, shop, 'Shop media updated');
});

/* ------------------------------------------------------------------ */
/*  Admin area                                                         */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/shops/admin/all?status=pending
 * @access  Private (admin)
 */
const adminListShops = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(Shop.find(), req.query)
    .search(['name', 'description', 'city'])
    .filter(['status', 'city', 'category'])
    .sort('-createdAt')
    .paginate();

  const [shops, total] = await Promise.all([
    features.query.populate('owner', 'name email avatar role isActive'),
    Shop.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, shops, buildPaginationMeta(features.page, features.limit, total), 'Shops list');
});

/**
 * @route   PUT /api/v1/shops/:id/status  (Admin)
 * @body    { status: approved | rejected | suspended, reason }
 * @desc    Approve / reject / suspend a shop.
 *          When a shop is not approved its products are hidden automatically.
 */
const moderateShop = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body;

  const shop = await Shop.findById(req.params.id);
  if (!shop) throw ApiError.notFound('Shop not found');

  shop.status = status;
  shop.rejectionReason = status === SHOP_STATUS.APPROVED ? '' : reason;
  await shop.save();

  if (status === SHOP_STATUS.APPROVED) {
    await Product.updateMany({ shop: shop._id }, { isActive: true });
  } else if (status === SHOP_STATUS.SUSPENDED || status === SHOP_STATUS.REJECTED) {
    await Product.updateMany({ shop: shop._id }, { isActive: false });
  }

  const messages = {
    [SHOP_STATUS.APPROVED]: 'Shop approved, its products are now visible',
    [SHOP_STATUS.REJECTED]: 'Shop rejected',
    [SHOP_STATUS.SUSPENDED]: 'Shop suspended, its products were hidden',
  };

  return sendSuccess(res, shop, messages[status] || 'Shop status updated');
});

/**
 * @route   GET /api/v1/shops/:id/stats   (Admin)
 * @desc    Quick numbers about one shop
 */
const getShopStats = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) throw ApiError.notFound('Shop not found');

  const [productsCount, pendingProducts, orders] = await Promise.all([
    Product.countDocuments({ shop: shop._id }),
    Product.countDocuments({ shop: shop._id, status: PRODUCT_STATUS.PENDING }),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.shop': shop._id, status: { $nin: [ORDER_STATUS.CANCELLED] } } },
      {
        $group: {
          _id: null,
          orders: { $addToSet: '$_id' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
    ]),
  ]);

  const stats = orders[0] || { orders: [], revenue: 0 };
  return sendSuccess(
    res,
    {
      shop: { _id: shop._id, name: shop.name, status: shop.status, rating: shop.rating },
      productsCount,
      pendingProducts,
      ordersCount: stats.orders.length,
      revenue: stats.revenue,
    },
    'Shop statistics'
  );
});

/**
 * @route   DELETE /api/v1/shops/:id      (Admin)
 * @desc    Delete a shop, its products and downgrade the owner to customer
 */
const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) throw ApiError.notFound('Shop not found');

  await Product.deleteMany({ shop: shop._id });
  await User.findByIdAndUpdate(shop.owner, { role: 'customer' });
  await shop.deleteOne();

  return sendSuccess(res, { _id: shop._id }, 'Shop and its products were deleted');
});

module.exports = {
  listShops,
  getShopBySlug,
  getMyShop,
  createShop,
  updateMyShop,
  uploadShopMedia,
  adminListShops,
  moderateShop,
  getShopStats,
  deleteShop,
};
