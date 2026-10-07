/**
 * pages/CheckoutPage.jsx
 * ---------------------------------------------------------
 * Delivery address + payment method + order recap, then place the order.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/order.api';
import EmptyState from '../components/EmptyState';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatPrice, formatDate, PLACEHOLDER_IMAGE } from '../config/constants';

const CheckoutPage = () => {
  const { cart, summary, refresh } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    city: '',
    street: '',
    details: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill the form with the default address of the customer
  useEffect(() => {
    const address = user?.addresses?.find((item) => item.isDefault) || user?.addresses?.[0];
    if (address) {
      setForm({
        fullName: address.fullName || user.name || '',
        phone: address.phone || user.phone || '',
        city: address.city || '',
        street: address.street || '',
        details: address.details || '',
      });
    }
  }, [user]);

  if (!cart.items.length) {
    return (
      <div className="container page">
        <EmptyState
          icon="🛒"
          title="Nothing to checkout"
          message="Your cart is empty."
          actionLabel="Go shopping"
          actionTo="/products"
        />
      </div>
    );
  }

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await orderApi.checkout({
        shippingAddress: form,
        paymentMethod,
        notes,
      });
      await refresh();
      showToast(response.message);
      navigate(`/orders/${response.data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Checkout</h1>
        <Link className="link-btn" to="/cart">← Back to cart</Link>
      </div>

      <form className="cart-layout" onSubmit={submit}>
        <div className="stack">
          <div className="card card-pad-lg">
            <h3>Delivery details</h3>
            {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="form-row">
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0599-000-000"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="street">Street</label>
                <input id="street" name="street" value={form.street} onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="details">Extra details (building, floor, landmark)</label>
              <input id="details" name="details" value={form.details} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="notes">Order note (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything the seller should know?"
              />
            </div>
          </div>

          <div className="card card-pad-lg">
            <h3>Payment method</h3>
            <label className="filter-radio">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              💵 Cash on delivery / pay at the salon
            </label>
            <label className="filter-radio" style={{ marginTop: '0.5rem' }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              💳 Card payment (demo mode)
            </label>
          </div>
        </div>

        <aside className="card card-pad-lg">
          <h3>Your order ({cart.itemsCount} item(s))</h3>

          {cart.items.map((item) => (
            <div className="summary-row" key={item._id}>
              <span className="row" style={{ gap: '0.5rem' }}>
                <img
                  src={item.product.images?.[0] || PLACEHOLDER_IMAGE}
                  alt={item.product.name}
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                />
                <span className="small">
                  {item.product.name} × {item.quantity}
                  {item.bookingDate && (
                    <em className="muted">
                      <br />📅 {formatDate(item.bookingDate)} {item.bookingTime}
                    </em>
                  )}
                </span>
              </span>
              <span className="small">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}

          <hr className="divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{summary.shippingFee === 0 ? 'Free' : formatPrice(summary.shippingFee)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(summary.total)}</span>
          </div>

          <button
            type="submit"
            className="btn btn-block btn-lg"
            disabled={saving}
            style={{ marginTop: '1rem' }}
          >
            {saving ? 'Placing your order…' : 'Place my order ✅'}
          </button>
          <p className="small muted text-center" style={{ marginTop: '0.75rem' }}>
            By ordering you accept the marketplace terms.
          </p>
        </aside>
      </form>
    </div>
  );
};

export default CheckoutPage;
