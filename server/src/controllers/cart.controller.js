/**
 * controllers/cart.controller.js
 * ---------------------------------------------------------
 * Server side cart: prices and totals are always computed from
 * the database (never trusted from the browser).
 */
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { money } = require('../utils/helpers');
const { STORE, PRODUCT_TYPES, PRODUCT_STATUS } = require('../config/constants');

/** Get (or lazily create) the cart of the current user. */
const findOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

/** Populate the products + their shops (used before sending a response). */
const populateCart = (cart) =>
  cart.populate({
    path: 'items.product',
    select: 'name slug images price discountPrice stock type status isActive shop',
    populate: { path: 'shop', select: 'name slug status' },
  });

/** Shape the response so the React cart page only has to render it. */
const buildCartPayload = (cart) => {
  const items = [];
  const warnings = [];
  let subtotal = 0;
  let itemsCount = 0;

  cart.items.forEach((item) => {
    const product = item.product;
    if (!product) {
      warnings.push('One product in your cart is no longer available and was skipped');
      return;
    }

    const unitPrice = product.discountPrice ?? product.price;
    const lineTotal = money(unitPrice * item.quantity);
    subtotal += lineTotal;
    itemsCount += item.quantity;

    if (product.type === PRODUCT_TYPES.PRODUCT && product.stock < item.quantity) {
      warnings.push(`Only ${product.stock} item(s) of "${product.name}" are left in stock`);
    }
    if (product.status !== PRODUCT_STATUS.APPROVED || product.isActive === false) {
      warnings.push(`"${product.name}" is currently not available`);
    }

    items.push({
      _id: item._id,
      product,
      quantity: item.quantity,
      bookingDate: item.bookingDate,
      bookingTime: item.bookingTime,
      note: item.note,
      unitPrice,
      lineTotal,
    });
  });

  const shippingFee = subtotal === 0 || subtotal >= STORE.freeShippingFrom ? 0 : STORE.shippingFee;
  const tax = money(subtotal * (STORE.taxRate || 0));

  return {
    _id: cart._id,
    items,
    itemsCount,
    warnings,
    summary: {
      subtotal: money(subtotal),
      shippingFee,
      tax,
      total: money(subtotal + shippingFee + tax),
      freeShippingFrom: STORE.freeShippingFrom,
      currencySymbol: STORE.currencySymbol,
    },
  };
};

/**
 * @route   GET /api/v1/cart
 * @access  Private (customer)
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  await populateCart(cart);
  return sendSuccess(res, buildCartPayload(cart), 'Your cart');
});

/**
 * @route   POST /api/v1/cart/items
 * @body    { productId, quantity, bookingDate, bookingTime, note }
 * @access  Private (customer)
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, bookingDate = null, bookingTime = '', note = '' } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== PRODUCT_STATUS.APPROVED || !product.isActive) {
    throw ApiError.badRequest('This product is not available right now');
  }
  if (product.type === PRODUCT_TYPES.PRODUCT && product.stock < 1) {
    throw ApiError.badRequest('This product is out of stock');
  }
  if (product.type === PRODUCT_TYPES.SERVICE && !bookingDate) {
    throw ApiError.badRequest('Please choose a booking date for this service');
  }

  const cart = await findOrCreateCart(req.user._id);
  cart.addItem({
    productId: product._id,
    quantity: Number(quantity) || 1,
    bookingDate: bookingDate || null,
    bookingTime,
    note,
  });

  // Never allow ordering more than the available stock
  if (product.type === PRODUCT_TYPES.PRODUCT) {
    const line = cart.items.find((item) => String(item.product) === String(product._id));
    if (line && line.quantity > product.stock) line.quantity = product.stock;
  }

  await cart.save();
  await populateCart(cart);

  return sendSuccess(res, buildCartPayload(cart), 'Added to your cart');
});

/**
 * @route   PUT /api/v1/cart/items/:itemId
 * @body    { quantity }
 * @access  Private (customer)
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined) throw ApiError.badRequest('Quantity is required');

  const cart = await findOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('This item is not in your cart');

  const product = await Product.findById(item.product).select('stock type name');
  if (product && product.type === PRODUCT_TYPES.PRODUCT && Number(quantity) > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} item(s) of "${product.name}" are available`);
  }

  const updated = cart.updateItemQuantity(req.params.itemId, quantity);
  if (!updated) throw ApiError.notFound('Cart item not found');

  await cart.save();
  await populateCart(cart);

  return sendSuccess(res, buildCartPayload(cart), 'Cart updated');
});

/**
 * @route   DELETE /api/v1/cart/items/:itemId
 * @access  Private (customer)
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  const removed = cart.removeItem(req.params.itemId);
  if (!removed) throw ApiError.notFound('Cart item not found');

  await cart.save();
  await populateCart(cart);

  return sendSuccess(res, buildCartPayload(cart), 'Item removed from your cart');
});

/**
 * @route   DELETE /api/v1/cart
 * @desc    Empty the cart
 * @access  Private (customer)
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  cart.clear();
  await cart.save();
  return sendSuccess(res, buildCartPayload(cart), 'Your cart is now empty');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  findOrCreateCart,
  buildCartPayload,
  populateCart,
};
