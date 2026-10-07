/**
 * components/StatusBadge.jsx
 * ---------------------------------------------------------
 * Coloured badge for a status coming from the API
 * (order / product / shop / payment).
 */
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  PRODUCT_STATUS_LABELS,
  SHOP_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../config/constants';

const VARIANTS = {
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
  pending: 'warning',
  paid: 'success',
  unpaid: 'warning',
  refunded: 'info',
};

const StatusBadge = ({ status, type = 'order' }) => {
  if (!status) return null;

  let label = status;
  let variant = VARIANTS[status] || 'info';

  if (type === 'order') {
    label = ORDER_STATUS_LABELS[status] || status;
    variant = ORDER_STATUS_VARIANTS[status] || 'info';
  }
  if (type === 'product') label = PRODUCT_STATUS_LABELS[status] || status;
  if (type === 'shop') label = SHOP_STATUS_LABELS[status] || status;
  if (type === 'payment') label = PAYMENT_STATUS_LABELS[status] || status;

  return <span className={`badge badge-${variant}`}>{label}</span>;
};

export default StatusBadge;
