import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { ORDER_STATUSES, formatDateTime, formatPrice } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const AdminOrdersPage = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', paymentStatus: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const response = await adminApi.orders(filters); setOrders(response.data); setMeta(response.meta); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters]);

  const updatePayment = async (orderId, paymentStatus) => {
    try { await adminApi.setPaymentStatus(orderId, paymentStatus); showToast(`Payment marked ${paymentStatus}`); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };
  const remove = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}? Stock will be restored.`)) return;
    try { await adminApi.deleteOrder(order._id); showToast('Order deleted'); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Orders</h2><p className="muted small">{meta?.total ?? 0} orders</p></div></div>
      <div className="toolbar"><input aria-label="Search order number" placeholder="Order number…" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} /><select aria-label="Filter order status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All order statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select><select aria-label="Filter payment status" value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value, page: 1 }))}><option value="">All payment statuses</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></div>
      {loading ? <Loader label="Loading orders…" /> : orders.length === 0 ? <EmptyState title="No orders found" message="There are no orders matching these filters." /> : <>
        <div className="table-wrap"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Order status</th><th>Payment</th><th>Actions</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><Link to={`/orders/${order._id}`}>{order.orderNumber}</Link><br /><span className="muted small">{order.items.length} line items</span></td><td>{order.customer?.name || 'Customer'}<br /><span className="muted small">{order.customer?.email}</span></td><td>{formatDateTime(order.createdAt)}</td><td>{formatPrice(order.total)}</td><td><StatusBadge status={order.status} /></td><td><select aria-label={`Payment status for ${order.orderNumber}`} value={order.paymentStatus} onChange={(event) => updatePayment(order._id, event.target.value)}><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></td><td><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(order)}>Delete</button></td></tr>)}</tbody></table></div>
        <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
      </>}
    </div>
  );
};

export default AdminOrdersPage;