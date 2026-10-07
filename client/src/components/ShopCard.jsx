/**
 * components/ShopCard.jsx
 * ---------------------------------------------------------
 * Seller storefront card (shop / salon) for the sellers page.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { PLACEHOLDER_SHOP, formatPrice } from '../config/constants';

const ShopCard = ({ shop }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const cover = !imageFailed && (shop.cover || shop.logo) ? shop.cover || shop.logo : PLACEHOLDER_SHOP;

  return (
    <article className="product-card">
      <div className="product-media">
        <Link to={`/shops/${shop.slug}`}>
          <img src={cover} alt={shop.name} loading="lazy" onError={() => setImageFailed(true)} />
        </Link>
        <div className="product-tags">
          <span className="badge badge-primary">{shop.category || 'Beauty'}</span>
          {shop.totalSales > 0 && <span className="badge badge-success">Top seller</span>}
        </div>
      </div>

      <div className="product-body">
        <Link to={`/shops/${shop.slug}`} className="product-name">{shop.name}</Link>
        <span className="product-shop">
          📍 {shop.city || 'Palestine'}
          {shop.openHours ? ` · ${shop.openHours}` : ''}
        </span>
        <RatingStars value={shop.rating || 0} count={shop.numReviews || 0} />
        <div className="product-foot">
          <span className="small muted">
            {shop.productsCount || 0} offers
            {shop.totalSales ? ` · ${formatPrice(shop.totalSales)} sold` : ''}
          </span>
          <Link className="btn btn-sm btn-outline" to={`/shops/${shop.slug}`}>
            Visit
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ShopCard;
