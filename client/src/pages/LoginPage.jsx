/**
 * pages/LoginPage.jsx
 * ---------------------------------------------------------
 * Email + password login (with one click demo accounts).
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';

const DEMO_ACCOUNTS = [
  { label: '👑 Admin', email: 'admin@beautymarket.com', password: 'admin123' },
  { label: '🏪 Seller', email: 'layla@beautymarket.com', password: 'seller123' },
  { label: '👤 Customer', email: 'sara@example.com', password: 'customer123' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(form);
      showToast(response.message || 'Welcome back!');
      const role = response.data.user.role;
      const fallback = role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useDemo = async (account) => {
    setForm({ email: account.email, password: account.password });
    setError('');
    setLoading(true);
    try {
      const response = await login({ email: account.email, password: account.password });
      showToast(`Logged in as ${response.data.user.role}`);
      const role = response.data.user.role;
      navigate(role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>{t.auth.welcome} 👋</h2>
        <p className="muted small">{t.auth.loginSubtitle}</p>

        {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">{t.auth.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">{t.auth.password}</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-block btn-lg" disabled={loading}>
            {loading ? t.auth.signingIn : t.auth.loginButton}
          </button>
        </form>

        <hr className="divider" />

        <p className="small muted text-center">{t.auth.demoAccounts}:</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="btn btn-light btn-sm"
              onClick={() => useDemo(account)}
              disabled={loading}
            >
              {account.label}
            </button>
          ))}
        </div>

        <p className="small text-center" style={{ marginTop: '1.25rem' }}>
          {t.auth.newHere} <Link to="/register">{t.auth.createAccount}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
