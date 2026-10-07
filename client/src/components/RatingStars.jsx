/**
 * components/RatingStars.jsx
 * ---------------------------------------------------------
 * Shows a 1-5 star rating (read only) or lets the user pick one.
 */
import { useState } from 'react';

export const RatingStars = ({ value = 0, count = 0, showValue = true }) => {
  const rounded = Math.round(Number(value));
  return (
    <span className="stars" title={`${Number(value).toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? '' : 'empty'}>★</span>
      ))}
      {showValue && (
        <span className="stars-value">
          {Number(value).toFixed(1)} {count > 0 && `(${count})`}
        </span>
      )}
    </span>
  );
};

/** Clickable rating used in the review form. */
export const RatingInput = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="rating-input" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= (hovered || value) ? 'active' : ''}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  );
};

export default RatingStars;
