/**
 * models/Category.js
 * ---------------------------------------------------------
 * Admin-managed categories, e.g.
 *  - Skin Care, Makeup, Perfume, Hair Care, Accessories (products)
 *  - Salon Services, Spa & Massage (services)
 */
const mongoose = require('mongoose');
const { PRODUCT_TYPES } = require('../config/constants');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name is too long'],
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, default: '' },
    icon: { type: String, default: '' }, // emoji shown in the UI, e.g. 💄
    kind: {
      type: String,
      enum: {
        values: [PRODUCT_TYPES.PRODUCT, PRODUCT_TYPES.SERVICE, 'both'],
        message: 'Kind must be: product, service or both',
      },
      default: 'both',
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.pre('save', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    const { makeSlug } = require('../utils/helpers');
    this.slug = makeSlug(this.name);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
