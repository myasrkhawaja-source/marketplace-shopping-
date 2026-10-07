/**
 * controllers/product.controller.js
 * ---------------------------------------------------------
 * The catalogue: public browsing (with search + filters),
 * the seller CRUD, and the admin moderation.
 */
const Product = require('../models/Product');
const Category = require('../models/Category');
const Shop = require('../models/Shop');
const Review = require('../models/Review');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');
const { buildPaginationMeta } = require('../utils/helpers');
const { filesToUrls } = require('../middlewares/upload');
const {
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  SHOP_STATUS,
  STORE,
} = require('../config/constants');

const POPULATE_FIELDS = [
  { path: 'category', select: 'name slug icon' },
  { path: 'shop', select: 'name slug logo city rating status' },
  { path: 'seller', select: 'name avatar' },
];

/** Resolve a category given either an id or a slug. */
const resolveCategoryFilter = async (value) => {
  if (!value) return null;
  const category = value.match(/^[0-9a-fA-F]{24}$/)
    ? await Category.findById(value).select('_id')
    : await Category.findOne({ slug: value }).select('_id');
  return category ? category._id : null;
};

/** Build the filter object used by the public catalogue. */
const buildPublicFilter = async (query = {}) => {
  const filter = { status: PRODUCT_STATUS.APPROVED, isActive: true };

  if (query.type) filter.type = query.type;
  if (query.isFeatured === 'true') filter.isFeatured = true;
  if (query.brand) filter.brand = query.brand;
  if (query.city) filter.city = query.city;
  if (query.tags) filter.tags = { $in: String(query.tags).split(',').map((t) => t.trim()) };
  if (query.minRating) filter.rating = { $gte: Number(query.minRating) };

  if (query.category) {
    // unknown category slug => return nothing instead of showing everything
    filter.category = (await resolveCategoryFilter(query.category)) || null;
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // Only expose products belonging to approved shops
  if (query.shop) {
    filter.shop = query.shop;
  } else {
    const approvedShops = await Shop.find({ status: SHOP_STATUS.APPROVED }).select('_id');
    filter.shop = { $in: approvedShops.map((shop) => shop._id) };
  }

  return filter;
};

/**
 * @route   GET /api/v1/products
 * @query   search, category, type, city, minPrice, maxPrice, minRating,
 *          isFeatured, tags, sort, page, limit
 * @access  Public
 */
const listProducts = asyncHandler(async (req, res) => {
  const filter = await buildPublicFilter(req.query);

  const features = new ApiFeatures(Product.find(filter), req.query)
    .search(['name', 'description', 'tags', 'brand'])
    .sort('-createdAt')
    .limitFields()
    .paginate();

  const [products, total] = await Promise.all([
    features.query.populate(POPULATE_FIELDS),
    Product.countDocuments(features.query.getFilter()),
  ]);

  return sendList(res, products, buildPaginationMeta(features.page, features.limit, total), 'Products');
});

/**
 * @route   GET /api/v1/products/featured
 * @desc    Home page blocks: featured, new arrivals, top rated, services
 * @access  Public
 */
const getHomeData = asyncHandler(async (req, res) => {
  const base = { status: PRODUCT_STATUS.APPROVED, isActive: true };

  const [featured, newArrivals, topRated, services, categories, shopsCount, productsCount] =
    await Promise.all([
      Product.find({ ...base, isFeatured: true }).populate(POPULATE_FIELDS).limit(8),
      Product.find(base).populate(POPULATE_FIELDS).sort('-createdAt').limit(8),
      Product.find({ ...base, rating: { $gte: 4 } }).populate(POPULATE_FIELDS).sort('-rating').limit(8),
      Product.find({ ...base, type: PRODUCT_TYPES.SERVICE }).populate(POPULATE_FIELDS).limit(6),
      Category.find({ isActive: true }).sort('sortOrder').limit(10),
      Shop.countDocuments({ status: SHOP_STATUS.APPROVED }),
      Product.countDocuments(base),
    ]);

  // Fallback so the home page is never empty
  const featuredProducts = featured.length ? featured : newArrivals;

  return sendSuccess(
    res,
    {
      featured: featuredProducts,
      newArrivals,
      topRated,
      services,
      categories,
      stats: { productsCount, shopsCount, categoriesCount: categories.length },
      store: STORE,
    },
    'Home page data'
  );
});

/**
 * @route   GET /api/v1/products/:idOrSlug
 * @access  Public
 */
const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const product = await Product.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug })
    .populate(POPULATE_FIELDS);
  if (!product) throw ApiError.notFound('Product not found');

  const isOwner = req.user && String(product.seller?._id) === String(req.user._id);
  const isAdmin = req.user?.role === 'admin';

  // Hidden products are only visible to their owner / the admin
  if ((product.status !== PRODUCT_STATUS.APPROVED || !product.isActive) && !isOwner && !isAdmin) {
    throw ApiError.notFound('Product not found');
  }

  // Count the visit (not for the owner, not for the admin)
  if (!isOwner && !isAdmin) {
    await Product.findByIdAndUpdate(product._id, { $inc: { viewsCount: 1 } });
  }

  const [reviews, related, purchased] = await Promise.all([
    Review.find({ product: product._id }).populate('user', 'name avatar').sort('-createdAt').limit(20),
    Product.find({
      ...(await buildPublicFilter({})),
      category: product.category?._id,
      _id: { $ne: product._id },
    })
      .populate(POPULATE_FIELDS)
      .limit(4),
    req.user
      ? Order.exists({ customer: req.user._id, 'items.product': product._id })
      : Promise.resolve(null),
  ]);

  return sendSuccess(
    res,
    {
      product,
      reviews,
      relatedProducts: related,
      isFavorite: req.user
        ? req.user.favorites.some((id) => String(id) === String(product._id))
        : false,
      canReview: Boolean(purchased),
    },
    'Product details'
  );
});

/**
 * @route   POST /api/v1/products/upload
 * @desc    Upload product images (multipart/form-data, field: images)
 * @access  Private (seller)
 */
const uploadImages = asyncHandler(async (req, res) => {
  const urls = filesToUrls(req);
  if (!urls.length) throw ApiError.badRequest('Please choose at least one image');
  return sendSuccess(res, { urls }, 'Images uploaded successfully');
});

/* ------------------------------------------------------------------ */
/*  Seller area                                                        */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/products/mine?status=&search=&page=
 * @desc    All the products/services of the logged-in seller
 * @access  Private (seller)
 */
const getMyProducts = asyncHandler(async (req, res) => {
  const filter = { seller: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const features = new ApiFeatures(Product.find(filter), req.query)
    .search(['name', 'description'])
    .sort('-createdAt')
    .paginate();

  const [products, total, counts] = await Promise.all([
    features.query.populate('category', 'name slug'),
    Product.countDocuments(features.query.getFilter()),
    Product.aggregate([
      { $match: { seller: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = counts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  const meta = {
    ...buildPaginationMeta(features.page, features.limit, total),
    byStatus: {
      pending: byStatus.pending || 0,
      approved: byStatus.approved || 0,
      rejected: byStatus.rejected || 0,
      total,
    },
  };

  return sendList(res, products, meta, 'My products');
});

/**
 * @route   POST /api/v1/products
 * @desc    Add a product / a beauty service (goes to the admin for approval)
 * @access  Private (seller with an approved shop)
 */
const createProduct = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    description: req.body.description,
    shortDescription: req.body.shortDescription || '',
    category: req.body.category,
    type: req.body.type || PRODUCT_TYPES.PRODUCT,
    price: req.body.price,
    discountPrice: req.body.discountPrice ?? null,
    stock: req.body.stock ?? 0,
    durationMinutes: req.body.durationMinutes || 60,
    availableDays: req.body.availableDays || [],
    images: req.body.images || [],
    tags: req.body.tags || [],
    brand: req.body.brand || '',
    city: req.body.city || req.shop.city || '',
    seller: req.user._id,
    shop: req.shop._id,
    status: PRODUCT_STATUS.PENDING, // a new offer always waits for the admin
  };

  if (payload.discountPrice !== null && payload.discountPrice >= payload.price) {
    throw ApiError.badRequest('Discount price must be lower than the regular price');
  }

  const product = await Product.create(payload);
  await Shop.findByIdAndUpdate(req.shop._id, { $inc: { productsCount: 1 } });

  return sendCreated(res, product, 'Your product was submitted and is waiting for the admin approval');
});

/**
 * @route   GET /api/v1/products/mine/:id
 * @desc    One of my products (used by the edit form)
 * @access  Private (seller)
 */
const getMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    seller: req.user._id,
  }).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');

  return sendSuccess(res, product, 'Product details');
});

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update one of my products. Important changes (name, price,
 *          description, images, category, type) send it back to review.
 * @access  Private (seller owner / admin)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const isOwner = String(product.seller) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You can only edit your own products');

  const sensitiveFields = ['name', 'description', 'price', 'discountPrice', 'images', 'category', 'type'];
  const editable = [
    'name', 'description', 'shortDescription', 'category', 'type', 'price', 'discountPrice',
    'stock', 'durationMinutes', 'availableDays', 'images', 'tags', 'brand', 'city', 'isActive',
  ];

  const previous = product.toObject();
  let needsReview = false;

  editable.forEach((field) => {
    if (req.body[field] === undefined) return;
    const changed =
      JSON.stringify(previous[field] ?? null) !== JSON.stringify(req.body[field] ?? null);
    if (changed && sensitiveFields.includes(field)) needsReview = true;
    product[field] = req.body[field];
  });

  if (product.discountPrice !== null && product.discountPrice >= product.price) {
    throw ApiError.badRequest('Discount price must be lower than the regular price');
  }

  // Only the admin can force a status change (approve / reject)
  if (isAdmin && req.body.status) {
    product.status = req.body.status;
    product.rejectionReason = req.body.rejectionReason || '';
    needsReview = false;
  } else if (needsReview && product.status === PRODUCT_STATUS.APPROVED) {
    product.status = PRODUCT_STATUS.PENDING;
    product.rejectionReason = '';
  }

  await product.save();

  return sendSuccess(
    res,
    product,
    product.status === PRODUCT_STATUS.PENDING && needsReview
      ? 'Saved. Your product is waiting for the admin approval again'
      : 'Product updated successfully'
  );
});

/** Remove a product from every cart / wish list (cleanup on delete). */
const cleanupProductReferences = async (productId) => {
  const Cart = require('../models/Cart');
  const User = require('../models/User');
  await Promise.all([
    Cart.updateMany({ 'items.product': productId }, { $pull: { items: { product: productId } } }),
    User.updateMany({ favorites: productId }, { $pull: { favorites: productId } }),
    Review.deleteMany({ product: productId }),
  ]);
};

/**
 * @route   DELETE /api/v1/products/:id
 * @access  Private (seller owner / admin)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const isOwner = String(product.seller) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You can only delete your own products');

  await cleanupProductReferences(product._id);
  await product.deleteOne();
  await Shop.findByIdAndUpdate(product.shop, { $inc: { productsCount: -1 } });

  return sendSuccess(res, { _id: product._id }, 'Product deleted successfully');
});

/* ------------------------------------------------------------------ */
/*  Admin moderation                                                   */
/* ------------------------------------------------------------------ */

/**
 * @route   GET /api/v1/products/admin/all?status=pending
 * @access  Private (admin)
 */
const adminListProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.shop) filter.shop = req.query.shop;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const features = new ApiFeatures(Product.find(filter), req.query)
    .search(['name', 'description', 'brand'])
    .sort('-createdAt')
    .paginate();

  const [products, total, pending] = await Promise.all([
    features.query.populate(POPULATE_FIELDS),
    Product.countDocuments(features.query.getFilter()),
    Product.countDocuments({ status: PRODUCT_STATUS.PENDING }),
  ]);

  const meta = { ...buildPaginationMeta(features.page, features.limit, total), pendingCount: pending };
  return sendList(res, products, meta, 'All products (admin)');
});

/**
 * @route   PUT /api/v1/products/:id/moderate   (Admin)
 * @body    { status: approved | rejected, reason }
 */
const moderateProduct = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body;
  if (![PRODUCT_STATUS.APPROVED, PRODUCT_STATUS.REJECTED].includes(status)) {
    throw ApiError.badRequest('Status must be approved or rejected');
  }

  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  product.status = status;
  product.rejectionReason = status === PRODUCT_STATUS.REJECTED ? reason : '';
  if (status === PRODUCT_STATUS.APPROVED) product.isActive = true;
  await product.save();

  return sendSuccess(
    res,
    product,
    status === PRODUCT_STATUS.APPROVED
      ? 'Product approved and published'
      : 'Product rejected, the seller will be notified'
  );
});

/**
 * @route   PUT /api/v1/products/:id/feature   (Admin)
 * @desc    Show / hide a product in the "featured" home block
 */
const toggleFeatured = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  product.isFeatured = req.body.isFeatured === undefined ? !product.isFeatured : Boolean(req.body.isFeatured);
  await product.save();

  return sendSuccess(
    res,
    product,
    product.isFeatured ? 'Product added to the featured list' : 'Product removed from the featured list'
  );
});

module.exports = {
  listProducts,
  getHomeData,
  getProduct,
  uploadImages,
  getMyProducts,
  createProduct,
  getMyProduct,
  updateProduct,
  deleteProduct,
  adminListProducts,
  moderateProduct,
  toggleFeatured,
};



