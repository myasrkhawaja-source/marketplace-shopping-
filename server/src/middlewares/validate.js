/**
 * middlewares/validate.js
 * ---------------------------------------------------------
 * Runs the express-validator chains declared in the route files and
 * answers with 422 + a list of { field, message } when something is wrong.
 *
 *   router.post('/', validate(createProductRules), controller)
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Main validator middleware. */
const validate = (rules = []) => {
  const runner = Array.isArray(rules) ? rules : [rules];
  return [
    ...runner,
    (req, res, next) => {
      const result = validationResult(req);
      if (result.isEmpty()) return next();

      const errors = result.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      }));
      return next(ApiError.unprocessable(errors[0].message, errors));
    },
  ];
};

module.exports = validate;
