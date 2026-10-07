/**
 * pages/ProductDetailsPage.jsx
 * ---------------------------------------------------------
 * Product / service page: gallery, price, cart, direct checkout,
 * service booking and the customer reviews.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../api/catalog.api';
import { orderApi } from '../api/order.api';
import { authApi } from '../api/auth.api';
import RatingStars, { RatingInput } from '../components/RatingStars';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';
import {
  formatPrice,
  formatDate,
  BOOKING_TIME_SLOTS,
  PLACEHOLDER_IMAGE,
  toInputDate,
} from '../config/constants';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [booking, setBooking] = useState({ date: '', time: '11:00', note: '' });
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await catalogApi.getProduct(slug);
      setData(response.data);
      setFavorite(response.data.isFavorite);
      setActiveImage(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) return <Loader label="Loading the product…" />;

  if (error || !data) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="icon">😕</div>
          <h2>{t.products.noResults}</h2>
          <p className="muted">{error}</p>
          <Link className="btn" to="/products">{t.nav.shop}</Link>
        </div>
      </div>
    );
  }

  const { product, reviews = [], relatedProducts = [], canReview } = data;
  const isService = product.type === 'service';
  const images = product.images?.length ? product.images : [PLACEHOLDER_IMAGE];
  const price = product.discountPrice || product.price;

  /** Ask the visitor to log in, then come back to this page. */
  const requireLogin = () => {
    showToast(t.auth.loginButton, 'info');
    navigate('/login', { state: { from: `/products/${slug}` } });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) return requireLogin();
    if (isService && !booking.date) {
      showToast('Please choose a booking date', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await addItem({
        productId: product._id,
        quantity: isService ? 1 : quantity,
        bookingDate: isService ? booking.date : null,
        bookingTime: isService ? booking.time : '',
        note: isService ? booking.note : '',
      });
      showToast(response.message);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) return requireLogin();
    if (isService && !booking.date) {
      showToast('Please choose a booking date', 'error');
      return;
    }

    const address = user?.addresses?.find((item) => item.isDefault) || user?.addresses?.[0];
    if (!address) {
      showToast('Please add a delivery address in your account first', 'info');
      navigate('/account');
      return;
    }

    setSaving(true);
    try {
      const response = await orderApi.checkout({
        shippingAddress: {
          fullName: address.fullName || user.name,
          phone: address.phone || user.phone || '0599-000-000',
          city: address.city,
          street: address.street,
          details: address.details,
        },
        paymentMethod: 'cash',
        items: [
          {
            product: product._id,
            quantity: isService ? 1 : quantity,
            bookingDate: isService ? booking.date : null,
            bookingTime: isService ? booking.time : '',
          },
        ],
      });
      showToast(response.message);
      navigate(`/orders/${response.data._id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast(t.auth.loginButton, 'info');
      return;
    }
    try {
      const response = await authApi.toggleFavorite(product._id);
      setFavorite(response.data.isFavorite);
      showToast(response.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await orderApi.createReview({
        product: product._id,
        rating: review.rating,
        comment: review.comment,
      });
      showToast(response.message);
      setReview({ rating: 5, comment: '' });
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container page">
      <p className="small muted">
        <Link to="/products">{t.nav.shop}</Link> · {product.category?.name || t.products.category} · {product.name}
      </p>

      <div className="product-layout">
        <div>
          <div className="gallery-main">
            <img
              src={images[activeImage]}
              alt={product.name}
              onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === activeImage ? 'active' : ''}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="row-between">
            <span className="badge badge-primary">
              {isService ? `💅 ${t.generic.service}` : `🛍️ ${t.generic.product}`}
            </span>
            <button type="button" className="btn-icon" onClick={toggleFavorite} title={t.auth.wishlist}>
              {favorite ? '❤️' : '🤍'} Save
            </button>
          </div>

          <h1>{product.name}</h1>
          <RatingStars value={product.rating || 0} count={product.numReviews || 0} />

          {product.shop && (
            <p className="small muted">
              {t.products.shop}{' '}
              <Link to={`/shops/${product.shop.slug}`}>
                <strong>{product.shop.name}</strong>
              </Link>
              {product.shop.city ? ` · ${product.shop.city}` : ''}
            </p>
          )}

          <div className="product-price-row">
            <span className="price">{formatPrice(price)}</span>
            {product.discountPrice > 0 && (
              <>
                <span className="price-old">{formatPrice(product.price)}</span>
                <span className="badge badge-danger">-{product.discountPercent}%</span>
              </>
            )}
          </div>

          <p>{product.description}</p>

          <div className="info-list">
            {product.brand && <div className="info-item"><strong>Brand</strong>{product.brand}</div>}
            <div className="info-item">
              <strong>{t.products.category}</strong>
              {product.category?.name || '—'}
            </div>
            {isService ? (
              <>
                <div className="info-item">
                  <strong>Duration</strong>
                  {product.durationMinutes} minutes
                </div>
                <div className="info-item">
                  <strong>Available days</strong>
                  {product.availableDays?.length ? product.availableDays.join(', ') : 'Every day'}
                </div>
              </>
            ) : (
              <div className="info-item">
                <strong>In stock</strong>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </div>
            )}
            <div className="info-item">
              <strong>Views</strong>
              {product.viewsCount || 0}
            </div>
          </div>

          {product.tags?.length > 0 && (
            <div className="row" style={{ marginBottom: '1rem' }}>
              {product.tags.map((tag) => (
                <Link key={tag} className="badge badge-accent" to={`/products?search=${tag}`}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {isService && (
            <div className="booking-box">
              <strong>📅 Choose your appointment</strong>
              <div className="form-row" style={{ marginTop: '0.6rem' }}>
                <div className="field">
                  <label htmlFor="booking-date">Date</label>
                  <input
                    id="booking-date"
                    type="date"
                    min={toInputDate(new Date())}
                    value={booking.date}
                    onChange={(event) =>
                      setBooking((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="booking-time">Time</label>
                  <select
                    id="booking-time"
                    value={booking.time}
                    onChange={(event) =>
                      setBooking((current) => ({ ...current, time: event.target.value }))
                    }
                  >
                    {BOOKING_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: '0.6rem' }}>
                <label htmlFor="booking-note">Note for the salon (optional)</label>
                <input
                  id="booking-note"
                  type="text"
                  placeholder="e.g. I prefer a female stylist"
                  value={booking.note}
                  onChange={(event) =>
                    setBooking((current) => ({ ...current, note: event.target.value }))
                  }
                />
              </div>
            </div>
          )}

          <div className="row" style={{ marginTop: '1.25rem' }}>
            {!isService && (
              <div className="qty-box">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(product.stock || 99, value + 1))}
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn btn-lg"
              onClick={handleAddToCart}
              disabled={saving || (!isService && product.stock === 0)}
            >
              🛒 {isService ? 'Book this service' : 'Add to cart'}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={handleBuyNow}
              disabled={saving || (!isService && product.stock === 0)}
            >
              ⚡ Buy now
            </button>
          </div>

          <p className="small muted" style={{ marginTop: '0.75rem' }}>
            🚚 Free delivery on orders above ₪200 · 💳 Cash on delivery or card payment
          </p>
        </div>
      </div>

      <section className="section">
        <div className="grid grid-2">
          {/* ------------------------------- Reviews ------------------------------- */}
          <div className="card card-pad-lg">
            <div className="card-title">
              <h3>{t.auth.myReviews} ({product.numReviews || 0})</h3>
              <RatingStars value={product.rating || 0} />
            </div>

            {isAuthenticated ? (
              <form className="form" onSubmit={submitReview} style={{ marginBottom: '1.25rem' }}>
                <div className="field">
                  <label>Your rating</label>
                  <RatingInput
                    value={review.rating}
                    onChange={(rating) => setReview((current) => ({ ...current, rating }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="review-comment">Your review</label>
                  <textarea
                    id="review-comment"
                    placeholder="Tell other customers about your experience…"
                    value={review.comment}
                    onChange={(event) =>
                      setReview((current) => ({ ...current, comment: event.target.value }))
                    }
                  />
                </div>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Sending…' : 'Publish my review'}
                </button>
                {canReview ? (
                  <span className="hint">✅ Verified purchase — you ordered this item.</span>
                ) : (
                  <span className="hint">ℹ️ You can review any product you are interested in.</span>
                )}
              </form>
            ) : (
              <p className="small muted">
                <Link to="/login">{t.auth.loginLink}</Link> to write a review.
              </p>
            )}

            {reviews.length === 0 ? (
              <p className="muted small">No reviews yet — be the first one!</p>
            ) : (
              reviews.map((item) => (
                <div className="review-item" key={item._id}>
                  <img
                    className="review-avatar"
                    src={item.user?.avatar || PLACEHOLDER_IMAGE}
                    alt={item.user?.name}
                    onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
                  />
                  <div>
                    <div className="row">
                      <strong>{item.user?.name || 'Customer'}</strong>
                      {item.isVerifiedPurchase && (
                        <span className="badge badge-success">Verified</span>
                      )}
                      <span className="small muted">{formatDate(item.createdAt)}</span>
                    </div>
                    <RatingStars value={item.rating} showValue={false} />
                    <p className="small" style={{ margin: '0.35rem 0 0' }}>{item.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ---------------------------- Related items ---------------------------- */}
          <div>
            <h3>You may also like</h3>
            {relatedProducts.length === 0 ? (
              <p className="muted small">No similar product yet.</p>
            ) : (
              <div className="grid grid-2">
                {relatedProducts.map((item) => (
                  <ProductCard key={item._id} product={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailsPage;
