/**
 * controllers/category.controller.js
 * ---------------------------------------------------------
 * Categories are managed by the admin and read by everybody.
 */
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const { PRODUCT_STATUS } = require('../config/constants');

/** Attach the number of approved products to every category. */
const withProductCounts = async (categories) => {
  const ids = categories.map((category) => category._id);
  const counts = await Product.aggregate([
    { $match: { category: { $in: ids }, status: PRODUCT_STATUS.APPROVED, isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const map = counts.reduce((acc, item) => ({ ...acc, [String(item._id)]: item.count }), {});
  return categories.map((category) => ({
    ...(category.toObject ? category.toObject({ virtuals: true }) : category),
    productsCount: map[String(category._id)] || 0,
  }));
};

/**
 * @route   GET /api/v1/categories?kind=product&all=true
 * @access  Public (the `all` flag needs an admin token)
 */
const listCategories = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.kind) query.kind = { $in: [req.query.kind, 'both'] };
  // only the admin can see the disabled categories
  if (!(req.query.all === 'true' && req.user?.role === 'admin')) query.isActive = true;

  const categories = await Category.find(query).sort('sortOrder name');
  return sendSuccess(res, await withProductCounts(categories), 'Categories');
});

/**
 * @route   GET /api/v1/categories/:idOrSlug
 * @access  Public
 */
const getCategory = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const category = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? await Category.findById(idOrSlug)
    : await Category.findOne({ slug: idOrSlug });

  if (!category) throw ApiError.notFound('Category not found');
  const [payload] = await withProductCounts([category]);
  return sendSuccess(res, payload, 'Category details');
});

/**
 * @route   POST /api/v1/categories      (Admin)
 */
const createCategory = asyncHandler(async (req, res) => {
  const exists = await Category.findOne({ name: req.body.name });
  if (exists) throw ApiError.conflict('A category with this name already exists');

  const category = await Category.create(req.body);
  return sendCreated(res, category, 'Category created successfully');
});

/**
 * @route   PUT /api/v1/categories/:id   (Admin)
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw ApiError.notFound('Category not found');
  return sendSuccess(res, category, 'Category updated successfully');
});

/**
 * @route   DELETE /api/v1/categories/:id (Admin)
 * @desc    Refuse to delete a category that still has products
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const productsCount = await Product.countDocuments({ category: req.params.id });
  if (productsCount > 0) {
    throw ApiError.badRequest(
      `This category still contains ${productsCount} product(s). Move or delete them first.`
    );
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  return sendSuccess(res, { _id: category._id }, 'Category deleted successfully');
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
