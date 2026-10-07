/**
 * pages/AccountPage.jsx
 * ---------------------------------------------------------
 * Customer account: profile, addresses, reviews and wish list.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { orderApi } from '../api/order.api';
import RatingStars from '../components/RatingStars';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';
import { formatDate, PLACEHOLDER_IMAGE } from '../config/constants';

const EMPTY_ADDRESS = {
  label: 'Home',
  fullName: '',
  phone: '',
  city: '',
  street: '',
  details: '',
  isDefault: false,
};

const AccountPage = () => {
  const { user, refresh, isSeller, shop } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [editingAddress, setEditingAddress] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', phone: user.phone || '' });
    setAddresses(user?.addresses || []);
  }, [user]);

  useEffect(() => {
    if (tab === 'reviews') orderApi.myReviews().then((r) => setReviews(r.data)).catch(() => {});
    if (tab === 'favorites') authApi.listFavorites().then((r) => setFavorites(r.data)).catch(() => {});
  }, [tab]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await authApi.updateProfile(profile);
      showToast(response.message);
      await refresh();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await authApi.changePassword(passwords);
      showToast(response.message);
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await authApi.uploadAvatar(file);
      showToast(response.message);
      await refresh();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    try {
      const response = editingAddress
        ? await authApi.updateAddress(editingAddress, addressForm)
        : await authApi.addAddress(addressForm);
      setAddresses(response.data);
      setAddressForm(EMPTY_ADDRESS);
      setEditingAddress(null);
      showToast(response.message);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const removeAddress = async (id) => {
    if (!window.confirm(t.auth.deleteAddress)) return;
    try {
      const response = await authApi.deleteAddress(id);
      setAddresses(response.data);
      showToast(response.message);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm(t.auth.deleteReview)) return;
    try {
      await orderApi.deleteReview(id);
      setReviews((current) => current.filter((item) => item._id !== id));
      showToast(t.auth.reviewDeleted);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <h1>{t.auth.myAccount}</h1>
        <span className="badge badge-primary">
          {user?.role}
          {isSeller && shop ? ` · ${shop.name}` : ''}
        </span>
      </div>

      <div className="tabs">
        {[
          { key: 'profile', label: '👤 Profile' },
          { key: 'addresses', label: '📍 Addresses' },
          { key: 'reviews', label: '⭐ My reviews' },
          { key: 'favorites', label: '💗 Wish list' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={tab === item.key ? 'active' : ''}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid grid-2">
          <div className="card card-pad-lg">
            <h3>Personal information</h3>
            <div className="row" style={{ marginBottom: '1rem' }}>
              <img
                src={user?.avatar || PLACEHOLDER_IMAGE}
                alt={user?.name}
                style={{ width: 74, height: 74, borderRadius: '50%', objectFit: 'cover' }}
                onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
              />
              <div className="field">
                <label htmlFor="avatar">Profile picture</label>
                <input id="avatar" type="file" accept="image/*" onChange={uploadAvatar} />
              </div>
            </div>

            <form className="form" onSubmit={saveProfile}>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  value={profile.name}
                  onChange={(event) => setProfile((c) => ({ ...c, name: event.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  value={profile.phone}
                  onChange={(event) => setProfile((c) => ({ ...c, phone: event.target.value }))}
                />
              </div>
              <div className="field">
                <label>Email (not editable)</label>
                <input value={user?.email || ''} disabled />
              </div>
              <button type="submit" className="btn" disabled={saving}>Save changes</button>
            </form>
          </div>

          <div className="stack">
            <div className="card card-pad-lg">
              <h3>Change password</h3>
              <form className="form" onSubmit={changePassword}>
                <div className="field">
                  <label htmlFor="currentPassword">Current password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(event) =>
                      setPasswords((c) => ({ ...c, currentPassword: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="newPassword">New password</label>
                  <input
                    id="newPassword"
                    type="password"
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={(event) =>
                      setPasswords((c) => ({ ...c, newPassword: event.target.value }))
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn btn-outline" disabled={saving}>
                  Update password
                </button>
              </form>
            </div>

            <div className="card">
              <h3>Account summary</h3>
              <p className="small muted" style={{ margin: 0 }}>
                Member since {formatDate(user?.createdAt)} · Role: {user?.role}
              </p>
              {isSeller && (
                <p className="small" style={{ marginTop: '0.5rem' }}>
                  <Link to="/seller">Go to my seller dashboard →</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {tab === 'addresses' && (
        <div className="grid grid-2">
          <div className="card card-pad-lg">
            <h3>{editingAddress ? 'Edit address' : 'Add a new address'}</h3>
            <form className="form" onSubmit={saveAddress}>
              <div className="form-row">
                <div className="field">
                  <label>Label</label>
                  <input
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((c) => ({ ...c, label: e.target.value }))}
                    placeholder="Home / Work"
                  />
                </div>
                <div className="field">
                  <label>Receiver name</label>
                  <input
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm((c) => ({ ...c, fullName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Phone</label>
                  <input
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm((c) => ({ ...c, phone: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>City *</label>
                  <input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((c) => ({ ...c, city: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Street</label>
                <input
                  value={addressForm.street}
                  onChange={(e) => setAddressForm((c) => ({ ...c, street: e.target.value }))}
                />
              </div>

              <div className="field">
                <label>Extra details</label>
                <input
                  value={addressForm.details}
                  onChange={(e) => setAddressForm((c) => ({ ...c, details: e.target.value }))}
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm((c) => ({ ...c, isDefault: e.target.checked }))}
                />
                Use as my default delivery address
              </label>

              <div className="row">
                <button type="submit" className="btn">
                  {editingAddress ? 'Update address' : 'Add address'}
                </button>
                {editingAddress && (
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressForm(EMPTY_ADDRESS);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card card-pad-lg">
            <h3>Saved addresses ({addresses.length})</h3>
            {addresses.length === 0 ? (
              <p className="muted small">You have not saved an address yet.</p>
            ) : (
              addresses.map((address) => (
                <div className="card" key={address._id} style={{ marginBottom: '0.75rem' }}>
                  <div className="row-between">
                    <strong>
                      {address.label} {address.isDefault && <span className="badge badge-success">Default</span>}
                    </strong>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() => {
                          setEditingAddress(address._id);
                          setAddressForm({ ...EMPTY_ADDRESS, ...address });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => removeAddress(address._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
                    {address.fullName || user?.name} · {address.phone || user?.phone}
                    <br />
                    📍 {address.city}
                    {address.street ? `, ${address.street}` : ''}
                    {address.details ? ` — ${address.details}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="card card-pad-lg">
          <h3>Reviews I wrote ({reviews.length})</h3>
          {reviews.length === 0 && <p className="muted small">You have not written a review yet.</p>}
          {reviews.map((item) => (
            <div className="review-item" key={item._id}>
              <div className="grow">
                <div className="row-between">
                  <strong>{item.product?.name || item.shop?.name || 'Review'}</strong>
                  <div className="table-actions">
                    {item.product?.slug && (
                      <Link className="btn btn-light btn-sm" to={`/products/${item.product.slug}`}>
                        View item
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => deleteReview(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <RatingStars value={item.rating} />
                <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
                  {item.comment || 'No comment'} · {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'favorites' && (
        <>
          {favorites.length === 0 ? (
            <EmptyState
              icon="💗"
              title="Your wish list is empty"
              message="Tap the heart on a product to save it here."
              actionLabel="Discover products"
              actionTo="/products"
            />
          ) : (
            <div className="grid grid-3">
              {favorites.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountPage;
