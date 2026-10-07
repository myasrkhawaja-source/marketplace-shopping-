/**
 * models/Order.js
 * ---------------------------------------------------------
 * A customer order: one or many lines, each line knows its shop
 * (so a seller sees only his own items + his own revenue).
 * Booking fields are filled when the line is a beauty service.
 */
const mongoose = require('mongoose');
const {
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} = require('../config/constants');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Snapshot of the product at purchase time
    name: { type: String, required: true },
    image: { type: String, default: '' },
    type: { type: String, enum: ['product', 'service'], default: 'product' },

    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },

    // Service booking
    bookingDate: { type: Date, default: null },
    bookingTime: { type: String, default: '' },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Full name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    street: { type: String, default: '', trim: true },
    details: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, 'An order needs at least one item'],
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },

    // Money
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },

    notes: { type: String, trim: true, maxlength: 500, default: '' },
    cancelReason: { type: String, default: '' },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------- Indexes ----------
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'items.shop': 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });
orderSchema.index({ createdAt: -1, status: 1 });

// ---------- Virtuals ----------
/** Number of pieces in the order. */
orderSchema.virtual('itemsCount').get(function itemsCount() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/** True when the customer can still cancel. */
orderSchema.virtual('canBeCancelled').get(function canBeCancelled() {
  return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(this.status);
});

/** Convenience flag used by the dashboards. */
orderSchema.virtual('isPaid').get(function isPaid() {
  return this.paymentStatus === PAYMENT_STATUS.PAID;
});

// ---------- Methods ----------
/** Push a new status into the history and set the status. */
orderSchema.methods.pushStatus = function pushStatus(status, note = '', changedBy = null) {
  this.status = status;
  this.statusHistory.push({ status, note, changedBy });
  if (status === ORDER_STATUS.DELIVERED) this.deliveredAt = new Date();
  if (status === ORDER_STATUS.CANCELLED) this.cancelledAt = new Date();
  return this;
};

module.exports = mongoose.model('Order', orderSchema);
