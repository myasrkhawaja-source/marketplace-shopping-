/**
 * controllers/dashboard.controller.js
 * ---------------------------------------------------------
 * Aggregated statistics for the three dashboards:
 *   - seller  : my products, my orders, my revenue, my bookings
 *   - admin   : whole platform (users, shops, products, orders, money)
 *   - customer: my orders, my spending, my upcoming bookings
 */
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { money } = require('../utils/helpers');
const {
  ORDER_STATUS,
  PRODUCT_STATUS,
  SHOP_STATUS,
  ROLES,
  PRODUCT_TYPES,
} = require('../config/constants');

/** First day of the month, 6 months ago (used by the charts). */
const chartStartDate = (months = 6) => {
  const date = new Date();
  date.setMonth(date.getMonth() - (months - 1));
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Monthly revenue/sales aggregate shared by the seller and admin dashboards. */
const buildMonthlyPipeline = (match, groupById = null) => [
  { $match: match },
  { $unwind: '$items' },
  ...(groupById ? [{ $match: { 'items.shop': groupById } }] : []),
  { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        order: '$_id',
        day: { $dayOfMonth: '$createdAt' },
      },
      dayTotal: { $sum: '$items.lineTotal' },
    },
  },
  {
    $group: {
      _id: { year: '$_id.year', month: '$_id.month' },
      revenue: { $sum: '$dayTotal' },
      orders: { $addToSet: '$_id.order' },
    },
  },
  { $project: { revenue: 1, orders: { $size: '$orders' } } },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
];

/**
 * @route   GET /api/v1/dashboard/seller
 * @access  Private (seller)
 */
const getSellerStats = asyncHandler(async (req, res) => {
  const shop = req.shop || (await Shop.findOne({ owner: req.user._id }));
  if (!shop) throw ApiError.notFound('You do not have a shop yet');

  const shopId = shop._id;
  const start = chartStartDate(6);

  const [
    productCounts,
    ordersCount,
    revenueAgg,
    monthly,
    topProducts,
    recentOrders,
    upcomingBookings,
    lowStock,
  ] = await Promise.all([
    Product.aggregate([{ $match: { shop: shopId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.shop': shopId } },
      { $group: { _id: '$status', count: { $addToSet: '$_id' } } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.shop': shopId, status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$items.lineTotal' }, itemsSold: { $sum: '$items.quantity' } } },
    ]),
    Order.aggregate(buildMonthlyPipeline({ createdAt: { $gte: start } }, shopId)),
    Product.aggregate([
      { $match: { shop: shopId } },
      { $sort: { soldCount: -1, rating: -1 } },
      { $limit: 5 },
      { $project: { name: 1, images: 1, price: 1, soldCount: 1, rating: 1, type: 1, stock: 1, viewsCount: 1 } },
    ]),
    Order.find({ 'items.shop': shopId })
      .populate('customer', 'name avatar')
      .sort('-createdAt')
      .limit(5),
    Order.find({
      'items.shop': shopId,
      'items.type': PRODUCT_TYPES.SERVICE,
      'items.bookingDate': { $gte: new Date() },
      status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED] },
    })
      .populate('customer', 'name phone avatar')
      .sort('items.bookingDate')
      .limit(10),
    Product.find({ shop: shopId, type: PRODUCT_TYPES.PRODUCT, stock: { $lte: 3 }, isActive: true })
      .select('name stock images')
      .limit(5),
  ]);

  const byStatus = productCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const ordersByStatus = ordersCount.reduce(
    (acc, item) => ({ ...acc, [item._id]: item.count.length }),
    {}
  );
  const ordersTotal = Object.values(ordersByStatus).reduce((sum, value) => sum + value, 0);
  const revenue = revenueAgg[0]?.revenue || 0;

  return sendSuccess(
    res,
    {
      shop: {
        _id: shop._id,
        name: shop.name,
        slug: shop.slug,
        logo: shop.logo,
        status: shop.status,
        rating: shop.rating,
        numReviews: shop.numReviews,
      },
      products: {
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
        pending: byStatus.pending || 0,
        approved: byStatus.approved || 0,
        rejected: byStatus.rejected || 0,
      },
      orders: {
        total: ordersTotal,
        pending: ordersByStatus[ORDER_STATUS.PENDING] || 0,
        confirmed: ordersByStatus[ORDER_STATUS.CONFIRMED] || 0,
        processing: ordersByStatus[ORDER_STATUS.PROCESSING] || 0,
        shipped: ordersByStatus[ORDER_STATUS.SHIPPED] || 0,
        delivered: ordersByStatus[ORDER_STATUS.DELIVERED] || 0,
        cancelled: ordersByStatus[ORDER_STATUS.CANCELLED] || 0,
      },
      revenue: {
        total: money(revenue),
        averageOrder: ordersTotal ? money(revenue / ordersTotal) : 0,
        itemsSold: revenueAgg[0]?.itemsSold || 0,
      },
      monthlySales: monthly.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        revenue: money(item.revenue),
        orders: item.orders,
      })),
      topProducts,
      recentOrders,
      upcomingBookings,
      lowStock,
    },
    'Seller dashboard'
  );
});

/**
 * @route   GET /api/v1/dashboard/admin
 * @access  Private (admin)
 */
const getAdminStats = asyncHandler(async (req, res) => {
  const start = chartStartDate(6);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    usersByRole,
    usersTotal,
    usersThisMonth,
    shopsByStatus,
    productsByStatus,
    productsByType,
    ordersByStatus,
    revenueAgg,
    revenueThisMonth,
    ordersToday,
    monthly,
    topProducts,
    topShops,
    recentOrders,
    recentUsers,
    reviewsAgg,
    productsByCategory,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Shop.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.aggregate(buildMonthlyPipeline({ createdAt: { $gte: start } })),
    Product.find({ status: PRODUCT_STATUS.APPROVED })
      .sort('-soldCount')
      .limit(5)
      .select('name images price soldCount rating type viewsCount')
      .populate('shop', 'name slug'),
    Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.shop',
          revenue: { $sum: '$items.lineTotal' },
          itemsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shop' },
      },
      { $unwind: { path: '$shop', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          revenue: 1,
          itemsSold: 1,
          name: '$shop.name',
          slug: '$shop.slug',
          logo: '$shop.logo',
          rating: '$shop.rating',
        },
      },
    ]),
    Order.find().populate('customer', 'name email avatar').sort('-createdAt').limit(5),
    User.find().sort('-createdAt').limit(5).select('name email role avatar createdAt'),
    Review.aggregate([{ $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }]),
    Product.aggregate([
      { $match: { status: PRODUCT_STATUS.APPROVED } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, name: '$category.name', icon: '$category.icon' } },
    ]),
  ]);

  const roleMap = usersByRole.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const shopMap = shopsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const productMap = productsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const typeMap = productsByType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const orderMap = ordersByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

  const revenue = revenueAgg[0]?.revenue || 0;
  const ordersCount = revenueAgg[0]?.orders || 0;

  return sendSuccess(
    res,
    {
      users: {
        total: usersTotal,
        customers: roleMap[ROLES.CUSTOMER] || 0,
        sellers: roleMap[ROLES.SELLER] || 0,
        admins: roleMap[ROLES.ADMIN] || 0,
        newThisMonth: usersThisMonth,
      },
      shops: {
        total: Object.values(shopMap).reduce((sum, value) => sum + value, 0),
        approved: shopMap[SHOP_STATUS.APPROVED] || 0,
        pending: shopMap[SHOP_STATUS.PENDING] || 0,
        rejected: shopMap[SHOP_STATUS.REJECTED] || 0,
        suspended: shopMap[SHOP_STATUS.SUSPENDED] || 0,
      },
      products: {
        total: Object.values(productMap).reduce((sum, value) => sum + value, 0),
        approved: productMap[PRODUCT_STATUS.APPROVED] || 0,
        pending: productMap[PRODUCT_STATUS.PENDING] || 0,
        rejected: productMap[PRODUCT_STATUS.REJECTED] || 0,
        physical: typeMap[PRODUCT_TYPES.PRODUCT] || 0,
        services: typeMap[PRODUCT_TYPES.SERVICE] || 0,
      },
      orders: {
        total: Object.values(orderMap).reduce((sum, value) => sum + value, 0),
        byStatus: orderMap,
        today: ordersToday,
        thisMonth: revenueThisMonth[0]?.orders || 0,
      },
      revenue: {
        total: money(revenue),
        thisMonth: money(revenueThisMonth[0]?.revenue || 0),
        averageOrder: ordersCount ? money(revenue / ordersCount) : 0,
      },
      monthlySales: monthly.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        revenue: money(item.revenue),
        orders: item.orders,
      })),
      topProducts,
      topShops,
      recentOrders,
      recentUsers,
      productsByCategory,
      reviews: {
        total: reviewsAgg[0]?.count || 0,
        averageRating: reviewsAgg[0]?.avg ? money(reviewsAgg[0].avg) : 0,
      },
    },
    'Admin dashboard'
  );
});

/**
 * @route   GET /api/v1/dashboard/customer
 * @access  Private (customer)
 */
const getCustomerStats = asyncHandler(async (req, res) => {
  const customerId = req.user._id;

  const [ordersByStatus, spentAgg, reviewsCount, favoritesCount, upcomingBookings, recentOrders] =
    await Promise.all([
      Order.aggregate([
        { $match: { customer: customerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { customer: customerId, status: { $ne: ORDER_STATUS.CANCELLED } } },
        { $group: { _id: null, spent: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
      Review.countDocuments({ user: customerId }),
      req.user.favorites?.length || 0,
      Order.find({
        customer: customerId,
        'items.bookingDate': { $gte: new Date() },
        status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED] },
      })
        .populate('items.shop', 'name slug logo city')
        .sort('items.bookingDate')
        .limit(5),
      Order.find({ customer: customerId })
        .populate('items.shop', 'name slug logo')
        .sort('-createdAt')
        .limit(5),
    ]);

  const statusMap = ordersByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const activeStatuses = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
  ];

  return sendSuccess(
    res,
    {
      orders: {
        total: Object.values(statusMap).reduce((sum, value) => sum + value, 0),
        active: activeStatuses.reduce((sum, status) => sum + (statusMap[status] || 0), 0),
        delivered: statusMap[ORDER_STATUS.DELIVERED] || 0,
        completed: statusMap[ORDER_STATUS.COMPLETED] || 0,
        cancelled: statusMap[ORDER_STATUS.CANCELLED] || 0,
        byStatus: statusMap,
      },
      spending: {
        total: money(spentAgg[0]?.spent || 0),
        orders: spentAgg[0]?.orders || 0,
      },
      reviewsCount,
      favoritesCount,
      upcomingBookings,
      recentOrders,
    },
    'Customer dashboard'
  );
});

module.exports = { getSellerStats, getAdminStats, getCustomerStats };


