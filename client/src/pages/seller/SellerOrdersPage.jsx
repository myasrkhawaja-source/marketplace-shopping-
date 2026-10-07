import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi } from '../../api/seller.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { ORDER_STATUSES, formatDateTime, formatPrice } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const NEXT_STATUS = { pending: 'confirmed', confirmed: 'processing', processing: 'shipped', shipped: 'delivered', delivered: 'completed' };

const SellerOrdersPage = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await sellerApi.orders(filters);
      setOrders(response.data);
      setMeta(response.meta);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters]);

  const advance = async (order, status) => {
    try {
      await sellerApi.setOrderStatus(order._id, status);
      showToast(`Order moved to ${status}`);
      load();
    } catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Orders</h2><p className="muted small">{meta?.total ?? 0} orders</p></div></div>
      <div className="toolbar">
        <input aria-label="Search order number" placeholder="Order number…" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
        <select aria-label="Filter order status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
      </div>
      {loading ? <Loader label="Loading orders…" /> : orders.length === 0 ? <EmptyState title="No orders found" message="New customer orders will appear here." /> : (
        <>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Placed</th><th>Your total</th><th>Status</th><th>Next step</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order._id}>
                <td><strong>{order.orderNumber}</strong></td>
                <td>{order.customer?.name || 'Customer'}<br /><span className="muted small">{order.customer?.phone}</span></td>
                <td>{order.items.map((item) => `${item.name} ×${item.quantity}`).join(', ')}</td>
                <td>{formatDateTime(order.createdAt)}</td>
                <td>{formatPrice(order.myTotal ?? order.items.reduce((sum, item) => sum + item.lineTotal, 0))}</td>
                <td><StatusBadge status={order.status} /></td>
                <td><div className="table-actions">{NEXT_STATUS[order.status] && <button type="button" className="btn btn-sm" onClick={() => advance(order, NEXT_STATUS[order.status])}>{NEXT_STATUS[order.status]}</button>}{['pending', 'confirmed'].includes(order.status) && <button type="button" className="btn btn-outline btn-sm" onClick={() => advance(order, 'cancelled')}>Cancel</button>}<Link className="btn btn-light btn-sm" to={`/orders/${order._id}`}>Details</Link></div></td>
              </tr>
            ))}</tbody>
          </table></div>
          <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </>
      )}
    </div>
  );
};

export default SellerOrdersPage;