/**
 * controllers/order.controller.js
 * ---------------------------------------------------------
 * Checkout, customer orders, seller order management and the
 * admin order section.
 */
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');
const { buildPaginationMeta } = require('../utils/helpers');
const orderService = require('../services/order.service');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  CANCELLABLE_ORDER_STATUSES,
} = require('../config/constants');

const ORDER_POPULATE = [
  { path: 'customer', select: 'name email phone avatar' },
  { path: 'items.shop', select: 'name slug logo owner' },
  { path: 'items.product', select: 'name slug images type' },
];

/**
 * @route   POST /api/v1/orders/checkout
 * @body    { shippingAddress:{...}, paymentMethod, notes, items? }
 * @desc    Create an order from the server cart, or directly from `items`
 *          (the "buy now" button of the product page).
 * @access  Private (customer)
 */
const checkout = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'cash', notes = '', items: directItems } = req.body;

  let items = directItems;
  let cart = null;
  let usedCart = false;

  if (!items || !items.length) {
    cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items.length) throw ApiError.badRequest('Your cart is empty');

    items = cart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      bookingDate: item.bookingDate,
      bookingTime: item.bookingTime,
      note: item.note,
    }));
    usedCart = true;
  }

  const order = await orderService.createOrder({
    customerId: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    notes,
  });

  // The cart is emptied only after a successful order
  if (usedCart && cart) {
    cart.clear();
    await cart.save();
  }

  await order.populate(ORDER_POPULATE);

  return sendCreated(res, order, `Order ${order.orderNumber} placed successfully`);
});

/**
 * @route   GET /api/v1/orders/my?status=&page=
 * @access  Private (customer)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const features = new ApiFeatures(Order.find(filter), req.query).sort('-createdAt').paginate();
  const [orders, total] = await Promise.all([
    features.query.populate(ORDER_POPULATE),
    Order.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, orders, buildPaginationMeta(features.page, features.limit, total), 'My orders');
});

/**
 * @route   GET /api/v1/orders/:id
 * @desc    A customer sees his own order, a seller sees orders that
 *          contain his items, the admin sees everything.
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
  if (!order) throw ApiError.notFound('Order not found');

  const isCustomer = String(order.customer?._id) === String(req.user._id);
  const isSeller = order.items.some((item) => String(item.seller) === String(req.user._id));
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isSeller && !isAdmin) {
    throw ApiError.forbidden('You are not allowed to see this order');
  }

  // The customer only needs his own lines, the seller only his own lines
  if (isSeller && !isAdmin && !isCustomer) {
    const myShop = await Shop.findOne({ owner: req.user._id }).select('_id');
    order.items = order.items.filter((item) => String(item.shop?._id) === String(myShop?._id));
  }

  return sendSuccess(res, order, 'Order details');
});

/**
 * @route   PUT /api/v1/orders/:id/cancel
 * @desc    The customer cancels his own order (only while pending/confirmed)
 * @access  Private (customer)
 */
const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.customer) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only cancel your own orders');
  }
  if (!CANCELLABLE_ORDER_STATUSES.includes(order.status)) {
    throw ApiError.badRequest(
      `An order in "${order.status}" state cannot be cancelled anymore, please contact the seller`
    );
  }

  await orderService.restoreStock(order);
  order.cancelReason = req.body.reason || 'Cancelled by the customer';
  order.pushStatus(ORDER_STATUS.CANCELLED, order.cancelReason, req.user._id);
  await order.save();

  return sendSuccess(res, order, 'Your order has been cancelled');
});

/* ------------------------------------------------------------------ */
/*  Seller area                                                        */
/* ------------------------------------------------------------------ */

/** Keep only the lines that belong to the seller's shop + his revenue. */
const shapeSellerOrder = (order, shopId) => {
  const own = order.items.filter((item) => String(item.shop?._id || item.shop) === String(shopId));
  const myTotal = own.reduce((sum, item) => sum + item.lineTotal, 0);
  const payload = order.toObject({ virtuals: true });
  payload.items = own;
  payload.myTotal = myTotal;
  return payload;
};

/**
 * @route   GET /api/v1/orders/seller/my?status=&page=
 * @desc    Orders that contain at least one item of my shop
 * @access  Private (seller)
 */
const getSellerOrders = asyncHandler(async (req, res) => {
  const shop = req.shop || (await Shop.findOne({ owner: req.user._id }));
  if (!shop) throw ApiError.notFound('You do not have a shop yet');

  const filter = { 'items.shop': shop._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.orderNumber = new RegExp(String(req.query.search).trim(), 'i');
  }

  const features = new ApiFeatures(Order.find(filter), req.query).sort('-createdAt').paginate();
  const [orders, total] = await Promise.all([
    features.query.populate(ORDER_POPULATE),
    Order.countDocuments(features.query.getFilter()),
  ]);

  const shaped = orders.map((order) => shapeSellerOrder(order, shop._id));

  return sendList(res, shaped, buildPaginationMeta(features.page, features.limit, total), 'My orders');
});

/**
 * @route   GET /api/v1/orders/seller/booking?date=2026-01-20
 * @desc    The agenda of a salon: booked services by date
 * @access  Private (seller)
 */
const getSellerBookings = asyncHandler(async (req, res) => {
  const shop = req.shop || (await Shop.findOne({ owner: req.user._id }));
  if (!shop) throw ApiError.notFound('You do not have a shop yet');

  const match = {
    'items.shop': shop._id,
    status: { $nin: [ORDER_STATUS.CANCELLED] },
    'items.type': 'service',
  };
  if (req.query.from || req.query.to) {
    match['items.bookingDate'] = {};
    if (req.query.from) match['items.bookingDate'].$gte = new Date(req.query.from);
    if (req.query.to) match['items.bookingDate'].$lte = new Date(req.query.to);
  }

  const orders = await Order.find(match).populate('customer', 'name phone avatar').sort('items.bookingDate');

  const bookings = [];
  orders.forEach((order) => {
    order.items
      .filter((item) => String(item.shop) === String(shop._id) && item.bookingDate)
      .forEach((item) => {
        bookings.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          customer: order.customer,
          service: item.name,
          price: item.lineTotal,
          bookingDate: item.bookingDate,
          bookingTime: item.bookingTime,
          note: item.note,
        });
      });
  });

  bookings.sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));
  return sendSuccess(res, bookings, 'Bookings agenda');
});

/**
 * @route   PUT /api/v1/orders/:id/status
 * @body    { status, note, paymentStatus? }
 * @desc    Move an order forward in the flow (seller of the order or admin)
 * @access  Private (seller of the order / admin)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = '', paymentStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const isAdmin = req.user.role === 'admin';
  const isSellerOfOrder = order.items.some((item) => String(item.seller) === String(req.user._id));
  if (!isAdmin && !isSellerOfOrder) {
    throw ApiError.forbidden('You can only manage the orders of your own shop');
  }

  orderService.assertStatusTransition(order.status, status);

  if (status === ORDER_STATUS.CANCELLED) await orderService.restoreStock(order);

  order.pushStatus(status, note, req.user._id);

  // The admin can also confirm that the money was received
  if (isAdmin && paymentStatus && Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
    order.paymentStatus = paymentStatus;
  }

  await order.save();
  await order.populate(ORDER_POPULATE);

  return sendSuccess(res, order, `Order moved to "${status}"`);
});

/* ------------------------------------------------------------------ */
/*  Admin area                                                         */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/orders/admin/all?status=&paymentStatus=&search=
 * @access  Private (admin)
 */
const adminListOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    filter.orderNumber = new RegExp(String(req.query.search).trim(), 'i');
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const features = new ApiFeatures(Order.find(filter), req.query).sort('-createdAt').paginate();

  const [orders, total, byStatus] = await Promise.all([
    features.query.populate(ORDER_POPULATE),
    Order.countDocuments(features.query.getFilter()),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const meta = {
    ...buildPaginationMeta(features.page, features.limit, total),
    byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
  };

  return sendList(res, orders, meta, 'All orders (admin)');
});

/**
 * @route   PUT /api/v1/orders/:id/payment   (Admin)
 * @body    { paymentStatus: unpaid | paid | refunded }
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
    throw ApiError.badRequest('Payment status must be unpaid, paid or refunded');
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus },
    { new: true }
  ).populate(ORDER_POPULATE);
  if (!order) throw ApiError.notFound('Order not found');

  return sendSuccess(res, order, `Payment marked as ${paymentStatus}`);
});

/**
 * @route   DELETE /api/v1/orders/:id       (Admin)
 * @desc    Remove a spam / test order (stock is restored first)
 */
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.status !== ORDER_STATUS.CANCELLED) await orderService.restoreStock(order);
  await order.deleteOne();

  return sendSuccess(res, { _id: order._id }, 'Order deleted');
});

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getSellerOrders,
  getSellerBookings,
  updateOrderStatus,
  adminListOrders,
  updatePaymentStatus,
  deleteOrder,
};

