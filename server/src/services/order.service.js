/**
 * services/order.service.js
 * ---------------------------------------------------------
 * Business rules for orders live here (totals, stock, status flow)
 * so the controller only deals with HTTP.
 */
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { STORE, ORDER_STATUS, PRODUCT_TYPES } = require('../config/constants');
const { money, generateOrderNumber } = require('../utils/helpers');

/**
 * Build the order lines from the cart / request items.
 * Prices ALWAYS come from the database (never from the client).
 *
 * @param {Array} items [{ product: id, quantity, bookingDate, bookingTime, notes }]
 * @param {string|null} onlyShopId when a seller re-checks items of his own shop
 */
const buildOrderItems = async (items = [], onlyShopId = null) => {
  if (!items.length) throw ApiError.badRequest('Your cart is empty');

  const ids = items.map((item) => item.product).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).populate('shop', 'name slug owner');

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => String(p._id) === String(item.product));
    if (!product) throw ApiError.notFound(`Product not found: ${item.product}`);

    if (onlyShopId && String(product.shop?._id) !== String(onlyShopId)) continue;

    if (product.status !== 'approved' || !product.isActive) {
      throw ApiError.badRequest(`"${product.name}" is not available right now`);
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);

    // Stock is only relevant for physical products
    if (product.type === PRODUCT_TYPES.PRODUCT && product.stock < quantity) {
      throw ApiError.badRequest(
        `Only ${product.stock} item(s) of "${product.name}" are left in stock`
      );
    }

    // Services must be booked with a date
    if (product.type === PRODUCT_TYPES.SERVICE && !item.bookingDate) {
      throw ApiError.badRequest(`Please choose a booking date for "${product.name}"`);
    }

    const unitPrice = product.finalPrice ?? product.price;
    const lineTotal = money(unitPrice * quantity);
    subtotal += lineTotal;

    orderItems.push({
      product: product._id,
      shop: product.shop?._id || null,
      seller: product.shop?.owner || null,
      name: product.name,
      image: Array.isArray(product.images) ? product.images[0] || '' : product.images || '',
      type: product.type,
      unitPrice,
      quantity,
      lineTotal,
      bookingDate: item.bookingDate || null,
      bookingTime: item.bookingTime || '',
      note: item.note || '',
    });
  }

  if (!orderItems.length) throw ApiError.badRequest('No valid items found for this order');

  const shippingFee = subtotal >= STORE.freeShippingFrom ? 0 : STORE.shippingFee;
  const tax = money(subtotal * (STORE.taxRate || 0));
  const total = money(subtotal + shippingFee + tax);

  return { orderItems, subtotal: money(subtotal), shippingFee, tax, total };
};

/** Create the order document (items already validated). */
const createOrder = async ({ customerId, items, shippingAddress, paymentMethod, notes, shopId }) => {
  const { orderItems, subtotal, shippingFee, tax, total } = await buildOrderItems(items, shopId);

  const sequence = (await require('../models/Order').countDocuments()) + 1;

  const order = await require('../models/Order').create({
    orderNumber: generateOrderNumber(sequence),
    customer: customerId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    notes: notes || '',
    subtotal,
    shippingFee,
    tax,
    total,
    status: ORDER_STATUS.PENDING,
    statusHistory: [{ status: ORDER_STATUS.PENDING, note: 'Order placed by the customer' }],
  });

  // Decrease stock of physical products
  await Promise.all(
    orderItems
      .filter((item) => item.type === PRODUCT_TYPES.PRODUCT)
      .map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, soldCount: item.quantity },
        })
      )
  );

  return order;
};

/** Restore the stock when an order is cancelled. */
const restoreStock = async (order) => {
  await Promise.all(
    order.items
      .filter((item) => item.type === PRODUCT_TYPES.PRODUCT)
      .map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity },
        })
      )
  );
};

/** Allowed next statuses for each current status (seller + admin flow). */
const NEXT_STATUSES = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/** Throw if the requested transition is not allowed. */
const assertStatusTransition = (currentStatus, nextStatus) => {
  const allowed = NEXT_STATUSES[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(
      `You cannot move an order from "${currentStatus}" to "${nextStatus}"`
    );
  }
};

module.exports = {
  buildOrderItems,
  createOrder,
  restoreStock,
  assertStatusTransition,
  NEXT_STATUSES,
};
