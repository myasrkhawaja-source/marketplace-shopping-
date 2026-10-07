/**
 * pages/ShopDetailsPage.jsx
 * ---------------------------------------------------------
 * Public storefront page of one seller (store or salon).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../api/catalog.api';
import ProductCard from '../components/ProductCard';
import RatingStars from '../components/RatingStars';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatDate, PLACEHOLDER_IMAGE, PLACEHOLDER_SHOP } from '../config/constants';

const ShopDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    catalogApi
      .getShop(slug)
      .then((response) => setData(response.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loader label="Loading the store…" />;
  if (!data) {
    return (
      <div className="container page">
        <EmptyState
          icon="🏪"
          title="Store not found"
          message="This shop may be pending approval or no longer exists."
          actionLabel="Browse all sellers"
          actionTo="/shops"
        />
      </div>
    );
  }

  const { shop, products = [] } = data;

  const handleAddToCart = async (product) => {
    if (product.type === 'service') {
      navigate(`/products/${product.slug}`);
      return;
    }
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart', 'info');
      return;
    }
    try {
      const response = await addItem({ productId: product._id, quantity: 1 });
      showToast(response.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const contact = [shop.phone, shop.whatsapp && `WhatsApp ${shop.whatsapp}`, shop.instagram, shop.website]
    .filter(Boolean);

  return (
    <div className="container page">
      <div className="shop-banner">
        <img
          src={shop.cover || shop.logo || PLACEHOLDER_SHOP}
          alt={shop.name}
          onError={(event) => { event.currentTarget.src = PLACEHOLDER_SHOP; }}
        />
      </div>

      <div className="shop-head">
        <img
          className="shop-logo"
          src={shop.logo || PLACEHOLDER_SHOP}
          alt={shop.name}
          onError={(event) => { event.currentTarget.src = PLACEHOLDER_SHOP; }}
        />
        <div className="grow">
          <h1 style={{ marginBottom: '0.2rem' }}>{shop.name}</h1>
          <div className="row">
            <RatingStars value={shop.rating || 0} count={shop.numReviews || 0} />
            <span className="badge badge-primary">{shop.category || 'Beauty'}</span>
            <span className="small muted">📍 {shop.city || 'Palestine'}</span>
            <span className="small muted">📦 {shop.productsCount || products.length} offers</span>
            <span className="small muted">
              🗓️ Joined {formatDate(shop.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3>About the store</h3>
          <p className="small muted">{shop.description || 'No description provided yet.'}</p>
          {shop.openHours && <p className="small">🕒 {shop.openHours}</p>}
        </div>
        <div className="card">
          <h3>Contact &amp; location</h3>
          <ul className="small" style={{ listStyle: 'none', padding: 0 }}>
            {shop.address && <li>🏠 {shop.address}</li>}
            {contact.map((item) => (
              <li key={item}>📞 {item}</li>
            ))}
            {shop.owner?.name && <li>👤 Owner: {shop.owner.name}</li>}
          </ul>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: '2rem' }}>
        <h2>Products &amp; services</h2>
        <Link className="link-btn" to={`/products?shop=${shop._id}`}>See in the catalogue →</Link>
      </div>

      {products.length === 0 ? (
        <EmptyState icon="📦" title="No offer published yet" />
      ) : (
        <div className="grid grid-3">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopDetailsPage;
