/**
 * routes/category.routes.js
 * ---------------------------------------------------------
 * /api/v1/categories
 * NOTE: the /:idOrSlug route must stay at the end of the file.
 */
const express = require('express');
const categoryController = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const { protect, optionalAuth, authorize } = require('../middlewares/auth');
const { createCategoryRules, updateCategoryRules } = require('../validators/category.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', optionalAuth, categoryController.listCategories);

router.post('/', protect, authorize(ROLES.ADMIN), validate(createCategoryRules), categoryController.createCategory);
router.put('/:id', protect, authorize(ROLES.ADMIN), validate(updateCategoryRules), categoryController.updateCategory);
router.delete('/:id', protect, authorize(ROLES.ADMIN), categoryController.deleteCategory);

router.get('/:idOrSlug', categoryController.getCategory);

module.exports = router;
