/**
 * pages/RegisterPage.jsx
 * ---------------------------------------------------------
 * Create a customer account OR a seller account (+ pending shop).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';

const RegisterPage = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    shopName: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role,
        ...(role === 'seller' ? { shopName: form.shopName, city: form.city } : {}),
      };
      const response = await register(payload);
      showToast(response.message || 'Account created');
      navigate(role === 'seller' ? '/seller' : '/', { replace: true });
    } catch (err) {
      setError(err.errors?.length ? `${err.message} — ${err.errors[0].field}` : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>{t.auth.createTitle} ✨</h2>
        <p className="muted small">{t.auth.createSubtitle}</p>

        <div className="role-switch" style={{ margin: '1rem 0' }}>
          <button
            type="button"
            className={role === 'customer' ? 'active' : ''}
            onClick={() => setRole('customer')}
          >
            👤 {t.auth.customerRole}
          </button>
          <button
            type="button"
            className={role === 'seller' ? 'active' : ''}
            onClick={() => setRole('seller')}
          >
            🏪 {t.auth.sellerRole}
          </button>
        </div>

        {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">{t.auth.fullName}</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Sara Ahmad"
              minLength={2}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="phone">{t.auth.phone}</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0599-000-000"
              />
            </div>
          </div>

          {role === 'seller' && (
            <div className="form-row">
              <div className="field">
                <label htmlFor="shopName">{t.auth.shopName}</label>
                <input
                  id="shopName"
                  name="shopName"
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="My Store"
                  minLength={3}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="city">{t.auth.city}</label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ramallah"
                />
              </div>
            </div>
          )}

          {role === 'seller' && (
            <p className="hint">
              ℹ️ Your shop starts as <strong>pending</strong>: the admin reviews it before your
              products become visible to customers.
            </p>
          )}

          <button type="submit" className="btn btn-block btn-lg" disabled={loading}>
            {loading ? t.auth.creating : t.auth.submitCreate}
          </button>
        </form>

        <p className="small text-center" style={{ marginTop: '1.25rem' }}>
          {t.auth.alreadyRegistered} <Link to="/login">{t.auth.loginLink}</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
