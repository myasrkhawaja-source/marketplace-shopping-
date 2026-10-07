/**
 * utils/asyncHandler.js
 * ---------------------------------------------------------
 * Wraps async controllers so we never write try/catch again:
 * any rejected promise is forwarded to the error middleware.
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
