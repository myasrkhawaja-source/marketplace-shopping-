/**
 * models/index.js
 * ---------------------------------------------------------
 * Single import point for every model:
 *      const { User, Product } = require('../models');
 */
module.exports = {
  User: require('./User'),
  Shop: require('./Shop'),
  Category: require('./Category'),
  Product: require('./Product'),
  Cart: require('./Cart'),
  Order: require('./Order'),
  Review: require('./Review'),
};
