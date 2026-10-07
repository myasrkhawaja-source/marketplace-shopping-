/**
 * models/Review.js
 * ---------------------------------------------------------
 * A customer can review a PRODUCT and/or the SHOP (seller).
 * One review per user per target (enforced by partial unique indexes).
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: { type: String, trim: true, maxlength: 800, default: '' },

    // true when the reviewer really ordered this item
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------- Indexes ----------
reviewSchema.index({ createdAt: -1 });
// One review per user per product / per shop (only when the field exists)
reviewSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { product: { $type: 'objectId' } } }
);
reviewSchema.index(
  { user: 1, shop: 1 },
  { unique: true, partialFilterExpression: { shop: { $type: 'objectId' } } }
);

// ---------- Validation ----------
reviewSchema.pre('validate', function requireTarget(next) {
  if (!this.product && !this.shop) {
    return next(new Error('A review must target a product and/or a shop'));
  }
  return next();
});

module.exports = mongoose.model('Review', reviewSchema);
