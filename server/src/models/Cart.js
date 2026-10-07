/**
 * models/Cart.js
 * ---------------------------------------------------------
 * One cart per customer. Items store a reference + quantity
 * (prices are always read from the Product document, never stored here).
 */
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Cart item must reference a product'],
    },
    quantity: { type: Number, default: 1, min: [1, 'Quantity must be at least 1'] },
    // Only used when the product is a bookable service
    bookingDate: { type: Date, default: null },
    bookingTime: { type: String, default: '' },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------- Methods ----------
/** Number of pieces inside the cart. */
cartSchema.methods.totalItems = function totalItems() {
  return this.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
};

/**
 * Add a product, or increase its quantity when it is already there.
 * A cart line is unique per (product + booking slot).
 */
cartSchema.methods.addItem = function addItem({ productId, quantity = 1, bookingDate = null, bookingTime = '', note = '' }) {
  const existing = this.items.find(
    (item) =>
      String(item.product) === String(productId) &&
      String(item.bookingDate || '') === String(bookingDate || '') &&
      String(item.bookingTime || '') === String(bookingTime || '')
  );

  if (existing) {
    existing.quantity += Number(quantity) || 1;
    if (note) existing.note = note;
  } else {
    this.items.push({ product: productId, quantity, bookingDate, bookingTime, note });
  }
  return this;
};

/** Change the quantity of one line (0 or less removes it). */
cartSchema.methods.updateItemQuantity = function updateItemQuantity(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) return false;
  if (Number(quantity) <= 0) {
    item.deleteOne();
    return true;
  }
  item.quantity = Number(quantity);
  return true;
};

/** Remove one line. */
cartSchema.methods.removeItem = function removeItem(itemId) {
  const item = this.items.id(itemId);
  if (!item) return false;
  item.deleteOne();
  return true;
};

cartSchema.methods.clear = function clear() {
  this.items = [];
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
