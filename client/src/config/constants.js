/**
 * src/config/constants.js
 * ---------------------------------------------------------
 * Shared constants + small formatters for the whole React app.
 * Change the currency / labels here once and the whole UI follows.
 */

export const APP_NAME = 'Marketplace';
export const CURRENCY_SYMBOL = '₪';

/** 150 -> "₪150.00" */
export const formatPrice = (value) =>
  `${CURRENCY_SYMBOL}${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** "12 Jan 2026" */
export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** "12 Jan 2026, 14:30" */
export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Value for <input type="date"> : 2026-01-20 */
export const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const ROLES = { CUSTOMER: 'customer', SELLER: 'seller', ADMIN: 'admin' };

export const PRODUCT_TYPES = { PRODUCT: 'product', SERVICE: 'service' };

export const PRODUCT_STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const SHOP_STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
];

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Badge colours (see styles/components.css -> .badge-*) */
export const ORDER_STATUS_VARIANTS = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-rating', label: 'Best rated' },
  { value: '-soldCount', label: 'Best selling' },
];

export const BOOKING_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** Inline SVG used when a product has no image (or the image fails). */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
       <rect width="600" height="600" fill="#f8e8ee"/>
       <text x="50%" y="52%" font-size="120" text-anchor="middle">💄</text>
     </svg>`
  );

/** The default image of a shop/storefront. */
export const PLACEHOLDER_SHOP =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
       <rect width="600" height="600" fill="#fdf3e3"/>
       <text x="50%" y="52%" font-size="120" text-anchor="middle">🏪</text>
     </svg>`
  );
