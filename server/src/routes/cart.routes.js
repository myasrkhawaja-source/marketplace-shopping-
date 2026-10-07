/**
 * routes/cart.routes.js
 * ---------------------------------------------------------
 * /api/v1/cart
 */
const express = require('express');
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:itemId', cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
