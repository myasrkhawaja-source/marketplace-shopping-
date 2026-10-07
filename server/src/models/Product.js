/**
 * models/Product.js
 * ---------------------------------------------------------
 * Holds BOTH kinds of offers (see PRODUCT_TYPES):
 *   - product : a physical beauty item  (stock is tracked)
 *   - service : a bookable beauty service (duration + booking date)
 *
 * A seller creates them, the admin approves them, and only then
 * they appear in the public catalogue.
 */
const mongoose = require('mongoose');
const {
  PRODUCT_TYPES,
  PRODUCT_STATUS,
} = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [120, 'Product name is too long'],
    },
    slug: { type: String, unique: true, index: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description is too long'],
    },
    shortDescription: { type: String, trim: true, maxlength: 200, default: '' },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(PRODUCT_TYPES),
      default: PRODUCT_TYPES.PRODUCT,
      index: true,
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: null,
      validate: {
        validator(value) {
          return value === null || value === undefined || value < this.price;
        },
        message: 'Discount price must be lower than the original price',
      },
    },

    // Physical products
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },

    // Services
    durationMinutes: { type: Number, default: 60, min: [15, 'Duration must be at least 15 minutes'] },
    requiresBooking: { type: Boolean, default: false },
    availableDays: { type: [String], default: [] }, // ['Sunday','Monday', ...]

    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 8,
        message: 'You can upload up to 8 images',
      },
    },
    tags: { type: [String], default: [] },
    brand: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },

    // Moderation / visibility
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // Stats
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------- Indexes ----------
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ status: 1, isActive: 1, createdAt: -1 });
productSchema.index({ shop: 1, status: 1 });
productSchema.index({ price: 1, rating: -1 });

// ---------- Virtuals ----------
/** Price the customer actually pays (discount aware). */
productSchema.virtual('finalPrice').get(function finalPrice() {
  return this.discountPrice && this.discountPrice < this.price
    ? this.discountPrice
    : this.price;
});

/** Discount percentage shown as a badge in the UI. */
productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

/** Convenience flags for the client UI. */
productSchema.virtual('isService').get(function isService() {
  return this.type === PRODUCT_TYPES.SERVICE;
});

productSchema.virtual('inStock').get(function inStock() {
  if (this.type === PRODUCT_TYPES.SERVICE) return true;
  return this.stock > 0;
});

// ---------- Middlewares ----------
productSchema.pre('save', function prepare(next) {
  const { makeSlug } = require('../utils/helpers');

  if (this.isModified('name') || !this.slug) this.slug = makeSlug(this.name);
  if (this.type === PRODUCT_TYPES.SERVICE) this.requiresBooking = true;
  if (this.discountPrice === undefined) this.discountPrice = null;
  next();
});

module.exports = mongoose.model('Product', productSchema);
