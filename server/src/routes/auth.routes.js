/**
 * routes/auth.routes.js
 * ---------------------------------------------------------
 * /api/v1/auth
 */
const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const {
  registerRules,
  loginRules,
  updatePasswordRules,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', authLimiter, validate(registerRules), authController.register);
router.post('/login', authLimiter, validate(loginRules), authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/password', protect, validate(updatePasswordRules), authController.updatePassword);

module.exports = router;
