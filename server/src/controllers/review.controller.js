/**
 * controllers/review.controller.js
 * ---------------------------------------------------------
 * Customers rate products AND sellers. After every change the
 * average rating of the product / shop is recalculated.
 */
const Review = require('../models/Review');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');
const { buildPaginationMeta } = require('../utils/helpers');
const ratingService = require('../services/rating.service');

/** Did this user really order the product? (=> verified review) */
const hasPurchased = async (userId, productId) =>
  Boolean(await Order.exists({ customer: userId, 'items.product': productId }));

/**
 * @route   POST /api/v1/reviews
 * @body    { product?, shop?, rating, comment }
 * @desc    Create a review, or update it when the user already reviewed
 *          the same target (one review per user per product / per shop).
 * @access  Private (customer)
 */
const upsertReview = asyncHandler(async (req, res) => {
  const { product: productId, shop: shopId, rating, comment = '' } = req.body;

  let product = null;
  let shop = null;

  if (productId) {
    product = await Product.findById(productId).select('_id shop');
    if (!product) throw ApiError.notFound('Product not found');
  }
  if (shopId) {
    shop = await Shop.findById(shopId).select('_id');
    if (!shop) throw ApiError.notFound('Shop not found');
  }
  // A product review also belongs to its shop (so the seller sees it)
  if (!shop && product?.shop) shop = { _id: product.shop };

  const isVerifiedPurchase = productId ? await hasPurchased(req.user._id, productId) : false;

  const target = {
    user: req.user._id,
    product: productId || null,
    shop: !productId && shop ? shop._id : null,
  };

  let review = await Review.findOne(target);
  let created = false;

  if (review) {
    review.rating = rating;
    review.comment = comment;
    review.isVerifiedPurchase = isVerifiedPurchase || review.isVerifiedPurchase;
    await review.save();
  } else {
    review = await Review.create({
      ...target,
      rating,
      comment,
      isVerifiedPurchase,
    });
    created = true;

    // A product review is also stored as a shop review when it is the first one
    if (productId && shop) {
      const alreadyReviewedShop = await Review.findOne({ user: req.user._id, shop: shop._id });
      if (!alreadyReviewedShop) {
        await Review.create({
          user: req.user._id,
          shop: shop._id,
          rating,
          comment,
          isVerifiedPurchase,
        });
      }
    }
  }

  const ratings = await ratingService.recalculateRatings({
    product: productId || null,
    shop: shop?._id || null,
  });

  return sendSuccess(
    res,
    { review, ratings },
    created ? 'Thank you for your review!' : 'Your review has been updated',
    created ? 201 : 200
  );
});

/**
 * @route   GET /api/v1/reviews/product/:productId
 * @access  Public
 */
const listProductReviews = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(Review.find({ product: req.params.productId }), req.query)
    .sort('-createdAt')
    .paginate();

  const [reviews, total] = await Promise.all([
    features.query.populate('user', 'name avatar'),
    Review.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, reviews, buildPaginationMeta(features.page, features.limit, total), 'Product reviews');
});

/**
 * @route   GET /api/v1/reviews/shop/:shopId
 * @access  Public
 */
const listShopReviews = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(Review.find({ shop: req.params.shopId }), req.query)
    .sort('-createdAt')
    .paginate();

  const [reviews, total] = await Promise.all([
    features.query.populate('user', 'name avatar').populate('product', 'name slug images'),
    Review.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, reviews, buildPaginationMeta(features.page, features.limit, total), 'Shop reviews');
});

/**
 * @route   GET /api/v1/reviews/seller/my
 * @desc    All the reviews received by my shop
 * @access  Private (seller)
 */
const getShopOwnerReviews = asyncHandler(async (req, res) => {
  const shop = req.shop || (await Shop.findOne({ owner: req.user._id }));
  if (!shop) throw ApiError.notFound('You do not have a shop yet');

  const features = new ApiFeatures(Review.find({ shop: shop._id }), req.query).sort('-createdAt').paginate();
  const [reviews, total, average] = await Promise.all([
    features.query.populate('user', 'name avatar').populate('product', 'name slug'),
    Review.countDocuments(features.query.getFilter()),
    Review.aggregate([
      { $match: { shop: shop._id } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]),
  ]);

  return sendList(
    res,
    reviews,
    {
      ...buildPaginationMeta(features.page, features.limit, total),
      averageRating: average[0]?.avg ? Math.round(average[0].avg * 10) / 10 : 0,
    },
    'Reviews of my shop'
  );
});

/**
 * @route   GET /api/v1/reviews/my
 * @desc    Reviews written by the logged-in customer
 * @access  Private
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .populate('shop', 'name slug logo')
    .sort('-createdAt');

  return sendSuccess(res, reviews, 'My reviews');
});

/**
 * @route   PUT /api/v1/reviews/:id
 * @access  Private (review owner)
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.user) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only edit your own reviews');
  }

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();

  await ratingService.recalculateRatings({ product: review.product, shop: review.shop });
  return sendSuccess(res, review, 'Review updated');
});

/**
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private (review owner / admin)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  const isOwner = String(review.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own reviews');
  }

  const { product, shop } = review;
  await review.deleteOne();
  await ratingService.recalculateRatings({ product, shop });

  return sendSuccess(res, { _id: review._id }, 'Review deleted');
});

/**
 * @route   GET /api/v1/reviews/admin/all          (Admin)
 * @desc    Every review of the platform (moderation)
 */
const adminListReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const features = new ApiFeatures(Review.find(filter), req.query).sort('-createdAt').paginate();
  const [reviews, total] = await Promise.all([
    features.query
      .populate('user', 'name email avatar')
      .populate('product', 'name slug')
      .populate('shop', 'name slug'),
    Review.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, reviews, buildPaginationMeta(features.page, features.limit, total), 'All reviews (admin)');
});

module.exports = {
  upsertReview,
  listProductReviews,
  listShopReviews,
  getShopOwnerReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  adminListReviews,
};
