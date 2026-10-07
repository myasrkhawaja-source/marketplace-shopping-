/**
 * components/Navbar.jsx
 * ---------------------------------------------------------
 * Sticky navigation: logo, main links, cart badge and the
 * account dropdown (customer / seller / admin shortcuts).
 */
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';
import { APP_NAME, PLACEHOLDER_IMAGE } from '../config/constants';

const Navbar = () => {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const { showToast } = useToast();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    showToast('You have been logged out', 'info');
    navigate('/');
  };

  const closeAll = () => {
    setOpen(false);
    setMenuOpen(false);
  };

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>🚚 {t.topbar.delivery}</span>
          <span>
            {t.topbar.sellerPrompt} <Link to="/register">{t.topbar.openStore}</Link>
          </span>
        </div>
      </div>

      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand" onClick={closeAll}>
            <span className="brand-logo">🛍️</span>
            <span>{APP_NAME}</span>
          </Link>

          <div className="lang-switcher" aria-label={t.languageLabel}>
            <button
              type="button"
              className={lang === 'ar' ? 'active' : ''}
              onClick={() => setLang('ar')}
            >AR</button>
            <button
              type="button"
              className={lang === 'he' ? 'active' : ''}
              onClick={() => setLang('he')}
            >HE</button>
          </div>

          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <ul className={`nav-links ${open ? 'open' : ''}`}>
            <li><NavLink to="/" onClick={closeAll}>{t.nav.home}</NavLink></li>
            <li><NavLink to="/products" onClick={closeAll}>{t.nav.shop}</NavLink></li>
            <li><NavLink to="/products?type=service" onClick={closeAll}>{t.nav.services}</NavLink></li>
            <li><NavLink to="/shops" onClick={closeAll}>{t.nav.sellers}</NavLink></li>
            {isAuthenticated && <li><NavLink to="/orders" onClick={closeAll}>{t.nav.myOrders}</NavLink></li>}
          </ul>

          <div className={`nav-actions ${open ? 'open' : ''}`}>
            {isAuthenticated ? (
              <>
                {(isSeller || isAdmin) && (
                  <Link className="btn btn-outline btn-sm" to={isAdmin ? '/admin' : '/seller'} onClick={closeAll}>
                    📊 {t.nav.dashboard}
                  </Link>
                )}

                <Link to="/cart" className="btn-icon nav-badge" onClick={closeAll} title={t.nav.cart}>
                  🛒{count > 0 && <span className="count">{count}</span>}
                </Link>

                <div className="dropdown">
                  <button
                    type="button"
                    className="user-chip"
                    onClick={() => setMenuOpen((value) => !value)}
                  >
                    <img
                      src={user.avatar || PLACEHOLDER_IMAGE}
                      alt={user.name}
                      onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
                    />
                    <span>{user.name.split(' ')[0]}</span>
                    <span aria-hidden>▾</span>
                  </button>

                  {menuOpen && (
                    <div className="dropdown-menu">
                      <Link to="/account" onClick={closeAll}>👤 {t.nav.account}</Link>
                      <Link to="/orders" onClick={closeAll}>🧾 {t.nav.myOrders}</Link>
                      {isSeller && <Link to="/seller" onClick={closeAll}>🏪 {t.nav.sellerDashboard}</Link>}
                      {isAdmin && <Link to="/admin" onClick={closeAll}>🛡️ {t.nav.adminPanel}</Link>}
                      <button type="button" className="danger" onClick={handleLogout}>
                        ⏏️ {t.nav.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link className="btn btn-light btn-sm" to="/login" onClick={closeAll}>{t.nav.login}</Link>
                <Link className="btn btn-sm" to="/register" onClick={closeAll}>{t.nav.signup}</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
