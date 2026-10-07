import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatPrice, PLACEHOLDER_SHOP } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const AdminShopsPage = () => {
  const { showToast } = useToast();
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const response = await adminApi.shops(filters); setShops(response.data); setMeta(response.meta); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters]);

  const moderate = async (shop, status) => {
    const reason = status === 'approved' ? '' : window.prompt(`Reason for ${status} this shop (optional):`, '');
    if (reason === null) return;
    try { await adminApi.moderateShop(shop._id, status, reason); showToast(`Shop ${status}`); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };
  const remove = async (shop) => {
    if (!window.confirm(`Delete shop “${shop.name}” and its catalogue?`)) return;
    try { await adminApi.deleteShop(shop._id); showToast('Shop deleted'); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Shop approvals</h2><p className="muted small">{meta?.total ?? 0} shops</p></div></div>
      <div className="toolbar"><input aria-label="Search shops" placeholder="Shop name or city…" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} /><select aria-label="Filter shops by status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select></div>
      {loading ? <Loader label="Loading shops…" /> : shops.length === 0 ? <EmptyState title="No shops found" message="There are no shops matching these filters." /> : <>
        <div className="table-wrap"><table className="table"><thead><tr><th>Shop</th><th>Owner</th><th>City</th><th>Rating</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>{shops.map((shop) => <tr key={shop._id}><td><div className="row"><img className="thumb" src={shop.logo || PLACEHOLDER_SHOP} alt="" /><span>{shop.name}<br /><span className="muted small">{shop.category}</span></span></div></td><td>{shop.owner?.name || '—'}<br /><span className="muted small">{shop.owner?.email}</span></td><td>{shop.city || '—'}</td><td>{Number(shop.rating || 0).toFixed(1)} ★</td><td>{formatDate(shop.createdAt)}</td><td><StatusBadge status={shop.status} type="shop" /></td><td><div className="table-actions">{shop.status !== 'approved' && <button type="button" className="btn btn-sm" onClick={() => moderate(shop, 'approved')}>Approve</button>}{shop.status !== 'rejected' && <button type="button" className="btn btn-light btn-sm" onClick={() => moderate(shop, 'rejected')}>Reject</button>}{shop.status !== 'suspended' && shop.status === 'approved' && <button type="button" className="btn btn-outline btn-sm" onClick={() => moderate(shop, 'suspended')}>Suspend</button>}<Link className="btn btn-light btn-sm" to={`/shops/${shop.slug}`}>View</Link><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(shop)}>Delete</button></div></td></tr>)}</tbody></table></div>
        <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
      </>}
    </div>
  );
};

export default AdminShopsPage;