/**
 * routes/review.routes.js
 * ---------------------------------------------------------
 * /api/v1/reviews
 */
const express = require('express');
const reviewController = require('../controllers/review.controller');
const validate = require('../middlewares/validate');
const { protect, authorize, attachShop } = require('../middlewares/auth');
const { upsertReviewRules, updateReviewRules } = require('../validators/review.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

/* ---------------- Public ---------------- */
router.get('/product/:productId', reviewController.listProductReviews);
router.get('/shop/:shopId', reviewController.listShopReviews);

/* ---------------- Private ---------------- */
router.post('/', protect, validate(upsertReviewRules), reviewController.upsertReview);
router.get('/my', protect, reviewController.getMyReviews);
router.get('/seller/my', protect, authorize(ROLES.SELLER), attachShop, reviewController.getShopOwnerReviews);
router.get('/admin/all', protect, authorize(ROLES.ADMIN), reviewController.adminListReviews);
router.put('/:id', protect, validate(updateReviewRules), reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;
