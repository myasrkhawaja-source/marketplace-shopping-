/**
 * components/Footer.jsx
 * ---------------------------------------------------------
 * Simple site footer with useful links.
 */
import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/constants';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>{APP_NAME}</h4>
            <p className="muted small">{t.footer.description}</p>
          </div>

          <div>
            <h4>{t.footer.shop}</h4>
            <ul>
              <li><Link to="/products">{t.footer.allProducts}</Link></li>
              <li><Link to="/products?type=service">{t.footer.services}</Link></li>
              <li><Link to="/products?sort=-rating">{t.footer.bestRated}</Link></li>
              <li><Link to="/shops">{t.footer.ourSellers}</Link></li>
            </ul>
          </div>

          <div>
            <h4>{t.footer.account}</h4>
            <ul>
              <li><Link to="/login">{t.footer.login}</Link></li>
              <li><Link to="/register">{t.footer.createAccount}</Link></li>
              <li><Link to="/orders">{t.footer.trackOrders}</Link></li>
              <li><Link to="/account">{t.footer.myProfile}</Link></li>
            </ul>
          </div>

          <div>
            <h4>{t.footer.forSellers}</h4>
            <ul>
              <li><Link to="/register">{t.footer.openShop}</Link></li>
              <li><Link to="/seller">{t.footer.sellerDashboard}</Link></li>
              <li><Link to="/seller/products">{t.footer.manageProducts}</Link></li>
              <li><Link to="/seller/orders">{t.footer.myOrdersBookings}</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span>MongoDB · Express · React</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
