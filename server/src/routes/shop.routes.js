/**
 * routes/shop.routes.js
 * ---------------------------------------------------------
 * /api/v1/shops   (beauty stores / salons)
 */
const express = require('express');
const shopController = require('../controllers/shop.controller');
const validate = require('../middlewares/validate');
const { protect, authorize, attachShop } = require('../middlewares/auth');
const { uploadShopMedia } = require('../middlewares/upload');
const { createShopRules, updateShopRules, moderateShopRules } = require('../validators/shop.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();
const sellerArea = [protect, authorize(ROLES.SELLER)];

/* ---------------- Seller ---------------- */
router.get('/me', ...sellerArea, shopController.getMyShop);
router.post('/', ...sellerArea, validate(createShopRules), shopController.createShop);
router.put('/me', ...sellerArea, attachShop, validate(updateShopRules), shopController.updateMyShop);
router.post('/me/media', ...sellerArea, attachShop, uploadShopMedia, shopController.uploadShopMedia);

/* ---------------- Admin ---------------- */
router.get('/admin/all', protect, authorize(ROLES.ADMIN), shopController.adminListShops);
router.put('/:id/status', protect, authorize(ROLES.ADMIN), validate(moderateShopRules), shopController.moderateShop);
router.get('/:id/stats', protect, authorize(ROLES.ADMIN), shopController.getShopStats);
router.delete('/:id', protect, authorize(ROLES.ADMIN), shopController.deleteShop);

/* ---------------- Public ---------------- */
router.get('/', shopController.listShops);
router.get('/:slug', shopController.getShopBySlug);

module.exports = router;
