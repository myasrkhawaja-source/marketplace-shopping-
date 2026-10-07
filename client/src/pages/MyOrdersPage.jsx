/**
 * pages/MyOrdersPage.jsx
 * ---------------------------------------------------------
 * Customer area: his orders (+ upcoming service bookings).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/order.api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, formatDate, formatPrice } from '../config/constants';

const MyOrdersPage = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        orderApi.myOrders(status ? { status } : {}),
        orderApi.customerStats(),
      ]);
      setOrders(ordersResponse.data);
      setBookings(statsResponse.data.upcomingBookings || []);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel the order ${order.orderNumber}?`)) return;
    try {
      const response = await orderApi.cancelOrder(order._id, 'Cancelled by the customer');
      showToast(response.message);
      await load();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>My orders</h1>
          <p className="muted small" style={{ margin: 0 }}>
            Follow your purchases and your booked services.
          </p>
        </div>
        <select style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>{ORDER_STATUS_LABELS[item]}</option>
          ))}
        </select>
      </div>

      {bookings.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>📅 Upcoming appointments</h3>
          {bookings.map((order) => (
            <div className="summary-row" key={order._id}>
              <span className="small">
                <Link to={`/orders/${order._id}`}>{order.orderNumber}</Link> ·{' '}
                {order.items
                  .filter((item) => item.bookingDate)
                  .map((item) => `${item.name} (${formatDate(item.bookingDate)} ${item.bookingTime})`)
                  .join(' · ')}
              </span>
              <StatusBadge status={order.status} />
            </div>
          ))}
        </div>
      )}

      {loading && <Loader label="Loading your orders…" />}

      {!loading && orders.length === 0 && (
        <EmptyState
          icon="🧾"
          title="No order yet"
          message="Your orders will appear here after your first purchase."
          actionLabel="Start shopping"
          actionTo="/products"
        />
      )}

      {!loading && orders.length > 0 && (
        <div className="stack">
          {orders.map((order) => (
            <div className="card" key={order._id}>
              <div className="row-between">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p className="small muted" style={{ margin: 0 }}>
                    {formatDate(order.createdAt)} · {order.itemsCount} item(s) ·{' '}
                    {formatPrice(order.total)}
                  </p>
                </div>
                <div className="row">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} type="payment" />
                </div>
              </div>

              <hr className="divider" />

              <div className="row-between">
                <span className="small muted">
                  {order.items.map((item) => item.name).join(', ')}
                </span>
                <div className="row">
                  <Link className="btn btn-light btn-sm" to={`/orders/${order._id}`}>
                    Details
                  </Link>
                  {order.canBeCancelled && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => cancelOrder(order)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
