import { useEffect, useState } from 'react';
import { sellerApi } from '../../api/seller.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatPrice } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const SellerBookingsPage = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: '', to: '' });

  useEffect(() => {
    setLoading(true);
    sellerApi.bookings(Object.fromEntries(Object.entries(range).filter(([, value]) => value)))
      .then((response) => setBookings(response.data))
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Bookings agenda</h2><p className="muted small">Service appointments for your shop</p></div></div>
      <div className="toolbar"><label className="field">From<input type="date" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} /></label><label className="field">To<input type="date" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} /></label><button type="button" className="btn btn-light btn-sm" onClick={() => setRange({ from: '', to: '' })}>Clear dates</button></div>
      {loading ? <Loader label="Loading bookings…" /> : bookings.length === 0 ? <EmptyState title="No bookings found" message="Upcoming appointments will appear here." /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Date &amp; time</th><th>Service</th><th>Customer</th><th>Contact</th><th>Price</th><th>Order</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>{bookings.map((booking) => <tr key={`${booking.orderId}-${booking.bookingDate}-${booking.bookingTime}-${booking.service}`}>
            <td>{formatDate(booking.bookingDate)}<br /><strong>{booking.bookingTime || '—'}</strong></td><td>{booking.service}</td><td>{booking.customer?.name || 'Customer'}</td><td>{booking.customer?.phone || '—'}</td><td>{formatPrice(booking.price)}</td><td>{booking.orderNumber}</td><td><StatusBadge status={booking.status} /></td><td>{booking.note || '—'}</td>
          </tr>)}</tbody>
        </table></div>
      )}
    </div>
  );
};

export default SellerBookingsPage;