/**
 * routes/product.routes.js
 * ---------------------------------------------------------
 * /api/v1/products
 * IMPORTANT: the static paths (/home, /mine, /admin, /upload) are declared
 * BEFORE the dynamic "/:idOrSlug" so Express matches them first.
 */
const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const { protect, optionalAuth, authorize, attachShop, requireApprovedShop } = require('../middlewares/auth');
const { uploadProductImages } = require('../middlewares/upload');
const { createProductRules, updateProductRules } = require('../validators/product.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();
const sellerArea = [protect, authorize(ROLES.SELLER)];

/* ---------------- Public ---------------- */
router.get('/', productController.listProducts);
router.get('/home', productController.getHomeData);
router.get('/featured', productController.getHomeData);

/* ---------------- Seller ---------------- */
router.get('/mine', ...sellerArea, productController.getMyProducts);
router.get('/mine/:id', ...sellerArea, productController.getMyProduct);
router.post('/upload', ...sellerArea, uploadProductImages, productController.uploadImages);
router.post(
  '/',
  ...sellerArea,
  attachShop,
  requireApprovedShop,
  validate(createProductRules),
  productController.createProduct
);

/* ---------------- Admin ---------------- */
router.get('/admin/all', protect, authorize(ROLES.ADMIN), productController.adminListProducts);
router.put('/:id/moderate', protect, authorize(ROLES.ADMIN), productController.moderateProduct);
router.put('/:id/feature', protect, authorize(ROLES.ADMIN), productController.toggleFeatured);

/* ---------------- Shared ---------------- */
router.put(
  '/:id',
  protect,
  authorize(ROLES.SELLER, ROLES.ADMIN),
  validate(updateProductRules),
  productController.updateProduct
);
router.delete('/:id', protect, authorize(ROLES.SELLER, ROLES.ADMIN), productController.deleteProduct);

/* ---------------- Public (must be last) ---------------- */
router.get('/:idOrSlug', optionalAuth, productController.getProduct);

module.exports = router;
