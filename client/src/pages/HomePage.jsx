/**
 * pages/HomePage.jsx
 * ---------------------------------------------------------
 * Landing page: hero, categories, featured products,
 * bookable beauty services, new arrivals and a seller CTA.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '../api/catalog.api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';

const FEATURES = [
  { icon: '🚚', title: 'Fast delivery', text: '1-3 days inside Palestine, free above ₪200.' },
  { icon: '✅', title: 'Verified sellers', text: 'Every shop is reviewed by our team.' },
  { icon: '💳', title: 'Pay as you like', text: 'Cash on delivery or card payment.' },
  { icon: '📅', title: 'Book services', text: 'Reserve your salon or spa appointment.' },
];

const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();
  const { isAuthenticated, isCustomer, isSeller } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    catalogApi
      .getHomeData()
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product) => {
    // Services must choose a booking date on their own page
    if (product.type === 'service') {
      navigate(`/products/${product.slug}`);
      return;
    }
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart', 'info');
      navigate('/login');
      return;
    }
    try {
      const response = await addItem({ productId: product._id, quantity: 1 });
      showToast(response.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <Loader label={t.home.loading} />;
  if (error) {
    return (
      <div className="container page">
        <div className="form-error">
          Could not reach the API: {error}. Make sure the server is running on port 5000.
        </div>
      </div>
    );
  }

  const { featured = [], services = [], newArrivals = [], categories = [], stats = {} } = data;

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge badge-primary">{t.home.badge}</span>
            <h1>{t.home.title} 🛍️</h1>
            <p className="lead">{t.home.lead}</p>

            <div className="hero-actions">
              <Link className="btn btn-lg" to="/products">🛍️ {t.home.shopNow}</Link>
              <Link className="btn btn-outline btn-lg" to="/products?type=service">
                📅 {t.home.bookService}
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{stats.productsCount || 0}+</strong>
                <span>{t.home.productsCount}</span>
              </div>
              <div className="hero-stat">
                <strong>{stats.shopsCount || 0}</strong>
                <span>{t.home.sellersCount}</span>
              </div>
              <div className="hero-stat">
                <strong>{stats.categoriesCount || 0}</strong>
                <span>{t.home.categoriesCount}</span>
              </div>
            </div>
          </div>

          <div className="hero-art" aria-hidden>💅</div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>{t.home.shopByCategory}</h2>
          <Link className="link-btn" to="/products">{t.home.viewAll} →</Link>
        </div>
        <div className="category-chips">
          {categories.map((category) => (
            <Link
              key={category._id}
              className="category-chip"
              to={`/products?category=${category.slug}`}
            >
              <span className="icon">{category.icon || '✨'}</span>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>{t.home.featuredPicks}</h2>
          <Link className="link-btn" to="/products?sort=-rating">{t.home.bestRated} →</Link>
        </div>
        {featured.length ? (
          <div className="grid grid-3">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        ) : (
          <EmptyState title="No products yet" message="The sellers have not published anything yet." />
        )}
      </section>

      {services.length > 0 && (
        <section className="section container">
          <div className="section-head">
            <h2>{t.home.bookServiceTitle}</h2>
            <Link className="link-btn" to="/products?type=service">{t.home.allServices} →</Link>
          </div>
          <div className="grid grid-3">
            {services.map((service) => (
              <ProductCard key={service._id} product={service} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>
      )}

      <section className="section container">
        <div className="section-head">
          <h2>{t.home.newArrivals}</h2>
          <Link className="link-btn" to="/products">{t.home.seeAll} →</Link>
        </div>
        <div className="grid grid-3">
          {newArrivals.slice(0, 6).map((product) => (
            <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="feature-strip">
          {FEATURES.map((feature) => (
            <div className="feature-item" key={feature.title}>
              <span className="icon" aria-hidden>{feature.icon}</span>
              <div>
                <strong>{feature.title}</strong>
                <p className="small muted" style={{ margin: 0 }}>{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="cta-band">
          <div>
            <h2>{t.home.sellerCtaTitle}</h2>
            <p>{t.home.sellerCtaText}</p>
          </div>
          {isAuthenticated && isSeller ? (
            <Link className="btn btn-light btn-lg" to="/seller">{t.home.dashboard}</Link>
          ) : (
            <Link className="btn btn-light btn-lg" to="/register">
              {isCustomer ? t.home.openSellerAccount : t.home.startSelling}
            </Link>
          )}
        </div>
      </section>
    </>
  );
};

export default HomePage;
