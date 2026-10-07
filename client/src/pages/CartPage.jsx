/**
 * pages/CartPage.jsx
 * ---------------------------------------------------------
 * Server side cart: quantities, totals and the checkout button.
 */
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice, formatDate, PLACEHOLDER_IMAGE } from '../config/constants';

const CartPage = () => {
  const { cart, summary, loading, updateItem, removeItem, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container page">
        <EmptyState
          icon="🔐"
          title={t.auth.loginButton}
          message={t.cart.savedOnAccount}
          actionLabel={t.auth.loginButton}
          actionTo="/login"
        />
      </div>
    );
  }

  if (loading && !cart.items.length) return <Loader label={t.cart.loading} />;

  if (!cart.items.length) {
    return (
      <div className="container page">
        <EmptyState
          icon="🛒"
          title={t.cart.emptyTitle}
          message={t.cart.emptyMessage}
          actionLabel={t.cart.startShopping}
          actionTo="/products"
        />
      </div>
    );
  }

  const changeQuantity = async (item, quantity) => {
    try {
      await updateItem(item._id, quantity);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const remove = async (item) => {
    try {
      await removeItem(item._id);
      showToast(t.cart.remove);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const emptyCart = async () => {
    if (!window.confirm(t.cart.emptyCartConfirm)) return;
    await clear();
    showToast(t.cart.emptyTitle, 'info');
  };

  return (
    <div className="container page">
      <div className="page-head">
        <h1>{t.cart.myCart} ({cart.itemsCount})</h1>
        <button type="button" className="link-btn" onClick={emptyCart}>{t.cart.emptyCart}</button>
      </div>

      {cart.warnings?.length > 0 && (
        <div className="form-error" style={{ marginBottom: '1rem' }}>
          {cart.warnings.map((warning) => <div key={warning}>⚠️ {warning}</div>)}
        </div>
      )}

      <div className="cart-layout">
        <div className="card">
          {cart.items.map((item) => (
            <div className="cart-item" key={item._id}>
              <img
                src={item.product.images?.[0] || PLACEHOLDER_IMAGE}
                alt={item.product.name}
                onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
              />

              <div>
                <Link to={`/products/${item.product.slug}`}>
                  <strong>{item.product.name}</strong>
                </Link>
                <p className="small muted" style={{ margin: '0.15rem 0' }}>
                  {item.product.type === 'service' ? '💅 Service' : '🛍️ Product'} ·{' '}
                  {item.product.shop?.name}
                </p>
                {item.bookingDate && (
                  <p className="small" style={{ margin: 0 }}>
                    📅 {formatDate(item.bookingDate)} {item.bookingTime && `· ${item.bookingTime}`}
                  </p>
                )}
                <span className="price small">{formatPrice(item.unitPrice)}</span>
              </div>

              <div className="text-right">
                <div className="qty-box">
                  <button type="button" onClick={() => changeQuantity(item, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(item, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <p className="small" style={{ margin: '0.5rem 0 0' }}>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </p>
                <button type="button" className="link-btn small" onClick={() => remove(item)}>
                  {t.cart.remove}
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="card card-pad-lg">
          <h3>{t.cart.orderSummary}</h3>
          <div className="summary-row">
            <span>{t.cart.subtotal}</span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>{t.cart.delivery}</span>
            <span>{summary.shippingFee === 0 ? t.cart.free : formatPrice(summary.shippingFee)}</span>
          </div>
          {summary.tax > 0 && (
            <div className="summary-row">
              <span>{t.orders.tax}</span>
              <span>{formatPrice(summary.tax)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>{t.cart.total}</span>
            <span>{formatPrice(summary.total)}</span>
          </div>

          {summary.subtotal < summary.freeShippingFrom && (
            <p className="small muted">
              Add {formatPrice(summary.freeShippingFrom - summary.subtotal)} more for free delivery 🚚
            </p>
          )}

          <button
            type="button"
            className="btn btn-block btn-lg"
            onClick={() => navigate('/checkout')}
            style={{ marginTop: '1rem' }}
          >
            {t.cart.checkout} →
          </button>
          <Link className="btn btn-light btn-block" to="/products" style={{ marginTop: '0.5rem' }}>
            {t.cart.startShopping}
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
