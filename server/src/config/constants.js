/**
 * config/constants.js
 * ---------------------------------------------------------
 * Single source of truth for roles, statuses, fees ...
 * Importing these constants (instead of writing raw strings)
 * keeps the models, validators and controllers in sync.
 */

const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
});

const PRODUCT_TYPES = Object.freeze({
  PRODUCT: 'product', // physical item  (cosmetics, perfume, accessories ...)
  SERVICE: 'service', // bookable beauty service (hair, nails, makeup ...)
});

const PRODUCT_STATUS = Object.freeze({
  PENDING: 'pending', // waiting for admin approval
  APPROVED: 'approved', // visible in the store
  REJECTED: 'rejected', // refused by admin
});

const SHOP_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed', // mainly for booked services
  CANCELLED: 'cancelled',
});

// Orders that a customer is still allowed to cancel
const CANCELLABLE_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
];

const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash', // cash on delivery / pay at the salon
  CARD: 'card', // mock card payment
});

const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
});

const SORT_OPTIONS = Object.freeze({
  NEWEST: '-createdAt',
  OLDEST: 'createdAt',
  PRICE_ASC: 'price',
  PRICE_DESC: '-price',
  RATING: '-rating',
  POPULAR: '-soldCount',
});

// Store configuration (change currency / fees here once for the whole app)
const STORE = Object.freeze({
  currency: 'ILS',
  currencySymbol: '₪',
  shippingFee: 15,
  freeShippingFrom: 200,
  taxRate: 0, // e.g. 0.16 for 16% VAT
  defaultPageSize: 12,
});

module.exports = {
  ROLES,
  PRODUCT_TYPES,
  PRODUCT_STATUS,
  SHOP_STATUS,
  ORDER_STATUS,
  CANCELLABLE_ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  SORT_OPTIONS,
  STORE,
};
