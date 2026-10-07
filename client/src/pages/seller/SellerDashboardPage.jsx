/**
 * pages/seller/SellerDashboardPage.jsx
 * ---------------------------------------------------------
 * Seller overview: KPIs, monthly sales chart, top products,
 * recent orders, upcoming bookings and low stock alerts.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi } from '../../api/seller.api';
import StatCard from '../../components/StatCard';
import BarChart from '../../components/BarChart';
import Loader from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatDateTime, formatPrice, PLACEHOLDER_IMAGE } from '../../config/constants';

const SellerDashboardPage = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerApi
      .dashboard()
      .then((response) => setStats(response.data))
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader label="Loading your statistics…" />;
  if (!stats) return <div className="form-error">Could not load the dashboard.</div>;

  const {
    shop, products, orders, revenue,
    monthlySales = [], topProducts = [], recentOrders = [],
    upcomingBookings = [], lowStock = [],
  } = stats;

  return (
    <div className="stack">
      {shop.status !== 'approved' && (
        <div className="form-error">
          ⚠️ Your shop is <strong>{shop.status}</strong>. You cannot publish new products until the
          admin approves it. <Link to="/seller/shop">Complete your shop profile →</Link>
        </div>
      )}

      <div className="grid grid-4">
        <StatCard label="Total revenue" value={formatPrice(revenue.total)} icon="💰" variant="success" />
        <StatCard label="Orders received" value={orders.total} icon="🧾" variant="info" />
        <StatCard label="Products / services" value={products.total} icon="📦" />
        <StatCard label="Items sold" value={revenue.itemsSold} icon="🛍️" variant="accent" />
      </div>

      <div className="grid grid-4">
        <StatCard label="Pending approval" value={products.pending} icon="⏳" variant="accent" />
        <StatCard label="Waiting orders" value={orders.pending} icon="🔔" />
        <StatCard label="Average order" value={formatPrice(revenue.averageOrder)} icon="📈" variant="info" />
        <StatCard label="Shop rating" value={`${shop.rating} ★`} icon="⭐" variant="success" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">
            <h3>Sales of the last 6 months</h3>
            <Link className="link-btn small" to="/seller/orders">All orders →</Link>
          </div>
          <BarChart
            data={monthlySales.map((item) => ({ label: item.month.slice(5), value: item.revenue }))}
          />
        </div>

        <div className="card">
          <div className="card-title">
            <h3>Upcoming bookings 📅</h3>
            <Link className="link-btn small" to="/seller/bookings">Agenda →</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="muted small">No upcoming appointment yet.</p>
          ) : (
            upcomingBookings.slice(0, 5).map((order) => (
              <div className="summary-row" key={order._id}>
                <span className="small">
                  <strong>{order.customer?.name || 'Customer'}</strong>
                  <br />
                  {order.items
                    .filter((item) => item.bookingDate)
                    .map((item) => `${item.name} · ${formatDate(item.bookingDate)} ${item.bookingTime}`)
                    .join(' | ')}
                </span>
                <StatusBadge status={order.status} />
              </div>
            ))
          )}

          {lowStock.length > 0 && (
            <>
              <hr className="divider" />
              <h3>⚠️ Low stock</h3>
              {lowStock.map((product) => (
                <div className="summary-row" key={product._id}>
                  <span className="small">{product.name}</span>
                  <span className="badge badge-warning">{product.stock} left</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-title">
            <h3>Top products</h3>
            <Link className="link-btn small" to="/seller/products">All products →</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="muted small">No product sales yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Price</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="row">
                          <img
                            className="thumb"
                            src={product.images?.[0] || PLACEHOLDER_IMAGE}
                            alt=""
                            onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
                          />
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.soldCount || 0}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{Number(product.rating || 0).toFixed(1)} ★</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Recent orders</h3>
            <Link className="link-btn small" to="/seller/orders">All orders →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="muted small">No orders received yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Placed</th>
                    <th>Your total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const shopItems = order.items.filter(
                      (item) => String(item.shop?._id || item.shop) === String(shop._id)
                    );
                    const shopTotal = shopItems.reduce((sum, item) => sum + item.lineTotal, 0);

                    return (
                      <tr key={order._id}>
                        <td>
                          <Link to="/seller/orders">{order.orderNumber}</Link>
                        </td>
                        <td>{order.customer?.name || 'Customer'}</td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>{formatPrice(shopTotal)}</td>
                        <td><StatusBadge status={order.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
