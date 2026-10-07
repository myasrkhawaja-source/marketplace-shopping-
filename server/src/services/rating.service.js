/**
 * services/rating.service.js
 * ---------------------------------------------------------
 * Keeps Product.rating / Shop.rating consistent with the Review collection.
 * Called after every create / update / delete of a review.
 */
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { money } = require('../utils/helpers');

/**
 * Aggregations do NOT cast types automatically, so a string id coming
 * from the request body must be converted to a real ObjectId first.
 */
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return mongoose.Types.ObjectId.isValid(String(id))
    ? new mongoose.Types.ObjectId(String(id))
    : null;
};

/** Recalculate the average rating of one product. */
const recalculateProductRating = async (productId) => {
  const id = toObjectId(productId);
  if (!id) return null;

  const stats = await Review.aggregate([
    { $match: { product: id } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length ? money(stats[0].avgRating) : 0;
  const numReviews = stats.length ? stats[0].numReviews : 0;

  await Product.findByIdAndUpdate(id, { rating: avgRating, numReviews });
  return { avgRating, numReviews };
};

/** Recalculate the average rating of one shop (beauty store / salon). */
const recalculateShopRating = async (shopId) => {
  const id = toObjectId(shopId);
  if (!id) return null;

  const stats = await Review.aggregate([
    { $match: { shop: id } },
    {
      $group: {
        _id: '$shop',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length ? money(stats[0].avgRating) : 0;
  const numReviews = stats.length ? stats[0].numReviews : 0;

  await Shop.findByIdAndUpdate(id, { rating: avgRating, numReviews });
  return { avgRating, numReviews };
};

/** Recalculate both (a review can target a product and/or a shop). */
const recalculateRatings = async ({ product, shop }) => {
  const results = {};
  if (product) results.product = await recalculateProductRating(product);
  if (shop) results.shop = await recalculateShopRating(shop);
  return results;
};

module.exports = {
  recalculateProductRating,
  recalculateShopRating,
  recalculateRatings,
};
