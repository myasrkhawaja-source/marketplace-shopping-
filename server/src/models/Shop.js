/**
 * models/Shop.js
 * ---------------------------------------------------------
 * The seller storefront: a beauty store or a salon.
 * Admin has to approve a shop before its products/services go public.
 */
const mongoose = require('mongoose');
const { SHOP_STATUS } = require('../config/constants');

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one shop per seller
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      minlength: [3, 'Shop name must be at least 3 characters'],
      maxlength: [80, 'Shop name is too long'],
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 1200, default: '' },
    category: { type: String, trim: true, default: 'Beauty Store' }, // Beauty Store | Salon | Perfume ...
    logo: { type: String, default: '' },
    cover: { type: String, default: '' },

    // Contact & location
    phone: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },

    // Social / working hours (salons need them)
    instagram: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    openHours: { type: String, trim: true, default: '' },

    // Moderation
    status: {
      type: String,
      enum: Object.values(SHOP_STATUS),
      default: SHOP_STATUS.PENDING,
    },
    rejectionReason: { type: String, default: '' },

    // Denormalised stats (kept in sync by the services layer)
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    productsCount: { type: Number, default: 0, min: 0 },
    totalSales: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------- Indexes ----------
shopSchema.index({ name: 'text', description: 'text', city: 'text' });
shopSchema.index({ status: 1, rating: -1 });

// ---------- Virtuals ----------
/** All products / services of this shop. */
shopSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shop',
});

// ---------- Middlewares ----------
shopSchema.pre('save', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    const { makeSlug } = require('../utils/helpers');
    this.slug = makeSlug(this.name);
  }
  next();
});

/** Used by the admin dashboard + product cards. */
shopSchema.virtual('isOpen').get(function isOpen() {
  return this.status === SHOP_STATUS.APPROVED;
});

module.exports = mongoose.model('Shop', shopSchema);
