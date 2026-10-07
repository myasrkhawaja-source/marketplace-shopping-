import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { formatPrice, PLACEHOLDER_IMAGE } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const AdminProductsPage = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', type: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const response = await adminApi.products(filters); setProducts(response.data); setMeta(response.meta); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters]);

  const moderate = async (product, status) => {
    const reason = status === 'approved' ? '' : window.prompt(`Reason for rejecting “${product.name}” (optional):`, '');
    if (reason === null) return;
    try { await adminApi.moderateProduct(product._id, status, reason); showToast(`Listing ${status}`); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };
  const feature = async (product) => {
    try { await adminApi.toggleFeatured(product._id, !product.isFeatured); showToast(product.isFeatured ? 'Removed from featured' : 'Added to featured'); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Product approvals</h2><p className="muted small">{meta?.total ?? 0} listings · {meta?.pendingCount ?? 0} pending review</p></div></div>
      <div className="toolbar"><input aria-label="Search products" placeholder="Search name, brand or description…" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} /><select aria-label="Filter listing status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><select aria-label="Filter listing type" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}><option value="">All types</option><option value="product">Products</option><option value="service">Services</option></select></div>
      {loading ? <Loader label="Loading listings…" /> : products.length === 0 ? <EmptyState title="No listings found" message="There are no products or services matching these filters." /> : <>
        <div className="table-wrap"><table className="table"><thead><tr><th>Listing</th><th>Seller / shop</th><th>Type</th><th>Price</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="row"><img className="thumb" src={product.images?.[0] || PLACEHOLDER_IMAGE} alt="" /><span>{product.name}<br /><span className="muted small">{product.category?.name}</span></span></div></td><td>{product.seller?.name || 'Seller'}<br /><span className="muted small">{product.shop?.name}</span></td><td>{product.type}</td><td>{formatPrice(product.price)}</td><td><StatusBadge status={product.status} type="product" /></td><td>{product.isFeatured ? 'Yes' : 'No'}</td><td><div className="table-actions">{product.status !== 'approved' && <button type="button" className="btn btn-sm" onClick={() => moderate(product, 'approved')}>Approve</button>}{product.status !== 'rejected' && <button type="button" className="btn btn-light btn-sm" onClick={() => moderate(product, 'rejected')}>Reject</button>}{product.status === 'approved' && <button type="button" className="btn btn-light btn-sm" onClick={() => feature(product)}>{product.isFeatured ? 'Unfeature' : 'Feature'}</button>}</div></td></tr>)}</tbody></table></div>
        <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
      </>}
    </div>
  );
};

export default AdminProductsPage;