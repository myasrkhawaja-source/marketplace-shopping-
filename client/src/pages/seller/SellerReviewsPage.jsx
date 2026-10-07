import { useEffect, useState } from 'react';
import { sellerApi } from '../../api/seller.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import RatingStars from '../../components/RatingStars';
import { formatDate } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const SellerReviewsPage = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sellerApi.reviews({ page })
      .then((response) => { setReviews(response.data); setMeta(response.meta); })
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Customer reviews</h2><p className="muted small">{meta?.total ?? 0} reviews · {Number(meta?.averageRating || 0).toFixed(1)} average rating</p></div></div>
      {loading ? <Loader label="Loading reviews…" /> : reviews.length === 0 ? <EmptyState title="No reviews yet" message="Customer feedback about your shop and products will appear here." /> : (
        <>
          <div className="stack">{reviews.map((review) => <article className="card card-pad-lg" key={review._id}>
            <div className="row-between"><div><strong>{review.user?.name || 'Customer'}</strong><span className="muted small"> · {formatDate(review.createdAt)}</span></div><RatingStars value={review.rating} /></div>
            <p>{review.comment || 'No written comment.'}</p>
            <p className="small muted" style={{ marginBottom: 0 }}>{review.product?.name || 'Shop review'}</p>
          </article>)}</div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      )}
    </div>
  );
};

export default SellerReviewsPage;