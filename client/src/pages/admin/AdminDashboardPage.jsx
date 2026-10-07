import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import BarChart from '../../components/BarChart';
import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime, formatPrice } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const AdminDashboardPage = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then((response) => setStats(response.data))
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading platform statistics…" />;
  if (!stats) return <div className="form-error">Could not load the admin dashboard.</div>;

  return (
    <div className="stack">
      <div className="grid grid-4">
        <StatCard label="Platform revenue" value={formatPrice(stats.revenue.total)} icon="💰" variant="success" />
        <StatCard label="Orders" value={stats.orders.total} icon="🧾" variant="info" />
        <StatCard label="Users" value={stats.users.total} icon="👥" />
        <StatCard label="Reviews" value={stats.reviews.total} icon="⭐" variant="accent" />
      </div>
      <div className="grid grid-4">
        <StatCard label="Shops awaiting review" value={stats.shops.pending} icon="🏬" variant="accent" />
        <StatCard label="Products awaiting review" value={stats.products.pending} icon="📦" variant="accent" />
        <StatCard label="Revenue this month" value={formatPrice(stats.revenue.thisMonth)} icon="📈" variant="info" />
        <StatCard label="Orders today" value={stats.orders.today} icon="🛍️" variant="success" />
      </div>
      <div className="grid grid-2">
        <section className="card"><div className="card-title"><h3>Monthly sales</h3><Link className="link-btn small" to="/admin/orders">All orders →</Link></div><BarChart data={stats.monthlySales.map((item) => ({ label: item.month.slice(5), value: item.revenue }))} /></section>
        <section className="card"><div className="card-title"><h3>Shop approvals</h3><Link className="link-btn small" to="/admin/shops">Review shops →</Link></div><div className="grid grid-2"><StatCard label="Approved" value={stats.shops.approved} variant="success" /><StatCard label="Pending" value={stats.shops.pending} variant="accent" /></div><hr className="divider" /><div className="card-title"><h3>Product approvals</h3><Link className="link-btn small" to="/admin/products">Review products →</Link></div><div className="grid grid-2"><StatCard label="Approved" value={stats.products.approved} variant="success" /><StatCard label="Pending" value={stats.products.pending} variant="accent" /></div></section>
      </div>
      <div className="grid grid-2">
        <section className="card"><div className="card-title"><h3>Recent orders</h3><Link className="link-btn small" to="/admin/orders">All orders →</Link></div>{stats.recentOrders.length ? stats.recentOrders.map((order) => <div className="summary-row" key={order._id}><span><strong>{order.orderNumber}</strong><br /><span className="small muted">{order.customer?.name || 'Customer'} · {formatDateTime(order.createdAt)}</span></span><StatusBadge status={order.status} /></div>) : <p className="muted small">No orders yet.</p>}</section>
        <section className="card"><div className="card-title"><h3>Top shops</h3><Link className="link-btn small" to="/admin/shops">Shop directory →</Link></div>{stats.topShops.length ? stats.topShops.map((shop) => <div className="summary-row" key={shop._id}><span><strong>{shop.name || 'Shop'}</strong><br /><span className="small muted">{shop.itemsSold} items sold</span></span><strong>{formatPrice(shop.revenue)}</strong></div>) : <p className="muted small">No shop sales yet.</p>}</section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;