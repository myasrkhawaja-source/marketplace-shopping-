/**
 * components/ProductCard.jsx
 * ---------------------------------------------------------
 * The product / service card used in every grid of the app.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { formatPrice, PLACEHOLDER_IMAGE } from '../config/constants';

const ProductCard = ({ product, onToggleFavorite, onAddToCart, showStatus = false }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = !imageFailed && product.images?.[0] ? product.images[0] : PLACEHOLDER_IMAGE;
  const price = product.discountPrice || product.price;
  const isService = product.type === 'service';

  return (
    <article className="product-card">
      <div className="product-media">
        <Link to={`/products/${product.slug || product._id}`}>
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </Link>

        <div className="product-tags">
          {isService && <span className="badge badge-accent">Service</span>}
          {product.discountPrice > 0 && (
            <span className="badge badge-danger">-{product.discountPercent || 0}%</span>
          )}
          {!isService && Number(product.stock) === 0 && (
            <span className="badge badge-warning">Out of stock</span>
          )}
          {showStatus && product.status === 'pending' && (
            <span className="badge badge-warning">Pending review</span>
          )}
          {showStatus && product.status === 'rejected' && (
            <span className="badge badge-danger">Rejected</span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            className="fav-btn"
            title="Add to wish list"
            onClick={() => onToggleFavorite(product)}
          >
            ♡
          </button>
        )}
      </div>

      <div className="product-body">
        <Link to={`/products/${product.slug || product._id}`} className="product-name">
          {product.name}
        </Link>

        <span className="product-shop">
          {isService ? '💅 ' : '🏪 '}
          {product.shop?.name || 'Trusted seller'}
          {product.city ? ` · ${product.city}` : ''}
        </span>

        <RatingStars value={product.rating || 0} count={product.numReviews || 0} />

        <div className="product-foot">
          <span className="price">
            {formatPrice(price)}
            {product.discountPrice > 0 && (
              <span className="price-old">{formatPrice(product.price)}</span>
            )}
          </span>

          {onAddToCart && (
            <button
              type="button"
              className="btn btn-sm"
              disabled={!isService && Number(product.stock) === 0}
              onClick={() => onAddToCart(product)}
            >
              {isService ? 'Book' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
