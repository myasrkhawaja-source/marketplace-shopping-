import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi } from '../../api/seller.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { formatPrice, PLACEHOLDER_IMAGE } from '../../config/constants';

const SellerProductsPage = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', type: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await sellerApi.myProducts(filters);
      setProducts(response.data);
      setMeta(response.meta);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete “${product.name}”?`)) return;
    try {
      await sellerApi.deleteProduct(product._id);
      showToast('Product deleted');
      loadProducts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const toggleActive = async (product) => {
    try {
      await sellerApi.updateProduct(product._id, { isActive: !product.isActive });
      showToast(product.isActive ? 'Product hidden from the shop' : 'Product made visible');
      loadProducts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h2>My products &amp; services</h2>
          <p className="muted small">{meta?.total ?? 0} listings</p>
        </div>
        <Link className="btn" to="/seller/products/new">Add listing</Link>
      </div>

      <div className="toolbar">
        <input
          aria-label="Search listings"
          placeholder="Search listings…"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <select aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select aria-label="Filter by type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
          <option value="">All types</option>
          <option value="product">Products</option>
          <option value="service">Services</option>
        </select>
      </div>

      {loading ? <Loader label="Loading listings…" /> : products.length === 0 ? (
        <EmptyState title="No listings found" message="Add a product or service to start building your catalogue." actionLabel="Add listing" actionTo="/seller/products/new" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Listing</th><th>Type</th><th>Price</th><th>Stock</th><th>Status</th><th>Visibility</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td><div className="row"><img className="thumb" src={product.images?.[0] || PLACEHOLDER_IMAGE} alt="" /><span>{product.name}</span></div></td>
                    <td>{product.type}</td>
                    <td>{formatPrice(product.finalPrice ?? product.price)}</td>
                    <td>{product.type === 'service' ? '—' : product.stock}</td>
                    <td><StatusBadge status={product.status} type="product" /></td>
                    <td>{product.isActive ? 'Visible' : 'Hidden'}</td>
                    <td><div className="table-actions">
                      <Link className="btn btn-light btn-sm" to={`/seller/products/${product._id}/edit`}>Edit</Link>
                      <button type="button" className="btn btn-light btn-sm" onClick={() => toggleActive(product)}>{product.isActive ? 'Hide' : 'Show'}</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => removeProduct(product)}>Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </>
      )}
    </div>
  );
};

export default SellerProductsPage;