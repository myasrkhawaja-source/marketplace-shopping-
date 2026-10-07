/**
 * pages/OrderDetailsPage.jsx
 * ---------------------------------------------------------
 * Full order page: items, booking info, totals, status timeline.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api/order.api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatDateTime, formatPrice, PLACEHOLDER_IMAGE } from '../config/constants';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await orderApi.myOrder(id);
      setOrder(response.data);
    } catch (error) {
      setOrder(null);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancel = async () => {
    if (!window.confirm(t.orders.cancelOrder)) return;
    try {
      const response = await orderApi.cancelOrder(order._id, 'Cancelled by the customer');
      showToast(response.message);
      await load();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) return <Loader label={t.orders.loading || 'Loading...'} />;

  if (!order) {
    return (
      <div className="container page">
        <EmptyState
          icon="🧾"
          title={t.orders.notFound}
          message={t.orders.notFoundMessage}
          actionLabel={t.orders.myOrders}
          actionTo="/orders"
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>{t.orders.order} {order.orderNumber}</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {t.orders.placedOn} {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="row">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} type="payment" />
          {order.canBeCancelled && (
            <button type="button" className="btn btn-outline btn-sm" onClick={cancel}>
              {t.orders.cancelOrder}
            </button>
          )}
          <Link className="btn btn-light btn-sm" to="/orders">{t.orders.allMyOrders}</Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>{t.orders.items} ({order.itemsCount})</h3>
          {order.items.map((item) => (
            <div className="summary-row" key={item._id}>
              <span className="row" style={{ gap: '0.6rem' }}>
                <img
                  src={item.image || PLACEHOLDER_IMAGE}
                  alt={item.name}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                  onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
                />
                <span className="small">
                  <strong>{item.name}</strong>
                  <br />
                  {item.type === 'service' ? '💅 Service' : '🛍️ Product'} × {item.quantity}
                  {item.bookingDate && (
                    <>
                      <br />📅 {formatDate(item.bookingDate)} {item.bookingTime}
                    </>
                  )}
                  {item.shop?.name && (
                    <>
                      <br />
                      <span className="muted">🏪 {item.shop.name}</span>
                    </>
                  )}
                </span>
              </span>
              <span className="small">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}

          <hr className="divider" />
          <div className="summary-row">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span>
          </div>
          {order.tax > 0 && (
            <div className="summary-row"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
          )}
          <div className="summary-row total">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3>Delivery address</h3>
            <p className="small" style={{ margin: 0 }}>
              <strong>{order.shippingAddress.fullName}</strong>
              <br />
              📞 {order.shippingAddress.phone}
              <br />
              📍 {order.shippingAddress.city}
              {order.shippingAddress.street ? `, ${order.shippingAddress.street}` : ''}
              {order.shippingAddress.details ? ` — ${order.shippingAddress.details}` : ''}
            </p>
            <hr className="divider" />
            <p className="small muted" style={{ margin: 0 }}>
              Payment: {order.paymentMethod === 'cash' ? 'Cash on delivery' : 'Card'}
            </p>
            {order.notes && <p className="small muted" style={{ margin: 0 }}>📝 {order.notes}</p>}
            {order.cancelReason && (
              <p className="small" style={{ margin: 0 }}>❌ {order.cancelReason}</p>
            )}
          </div>

          <div className="card">
            <h3>Order tracking</h3>
            <ul className="timeline">
              {order.statusHistory.map((step) => (
                <li key={`${step.status}-${step.at}`}>
                  <div className="row-between">
                    <span><StatusBadge status={step.status} /></span>
                    <span className="small muted">{formatDateTime(step.at)}</span>
                  </div>
                  {step.note && (
                    <p className="small muted" style={{ margin: '0.2rem 0 0' }}>{step.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
