/**
 * routes/user.routes.js
 * ---------------------------------------------------------
 * /api/v1/users   (profile, addresses, favourites + admin)
 */
const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const { protect, authorize } = require('../middlewares/auth');
const { uploadAvatar: uploadAvatarMiddleware } = require('../middlewares/upload');
const { updateProfileRules, addressRules } = require('../validators/auth.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Everything below requires a logged-in user
router.use(protect);

// ---- My profile ----
router.put('/me', validate(updateProfileRules), userController.updateProfile);
router.post('/me/avatar', uploadAvatarMiddleware, userController.uploadAvatar);

// ---- My addresses ----
router.get('/me/addresses', userController.listAddresses);
router.post('/me/addresses', validate(addressRules), userController.addAddress);
router.put('/me/addresses/:addressId', userController.updateAddress);
router.delete('/me/addresses/:addressId', userController.deleteAddress);

// ---- My wish list ----
router.get('/me/favorites', userController.listFavorites);
router.post('/me/favorites/:productId', userController.toggleFavorite);

// ---- Admin section ----
router.get('/', authorize(ROLES.ADMIN), userController.listUsers);
router.get('/:id', authorize(ROLES.ADMIN), userController.getUserById);
router.put('/:id', authorize(ROLES.ADMIN), userController.updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), userController.deleteUser);

module.exports = router;
