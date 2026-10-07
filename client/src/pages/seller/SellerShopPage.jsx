import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi } from '../../api/seller.api';
import Loader from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../hooks/useToast';

const EMPTY_SHOP = { name: '', description: '', category: 'Store', city: '', address: '', phone: '', whatsapp: '', instagram: '', website: '', openHours: '' };

const SellerShopPage = () => {
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(EMPTY_SHOP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState({ logo: null, cover: null });

  useEffect(() => {
    sellerApi.myShop()
      .then((response) => { setShop(response.data); setForm({ ...EMPTY_SHOP, ...response.data }); })
      .catch((error) => { if (error.status !== 404) showToast(error.message, 'error'); })
      .finally(() => setLoading(false));
  }, []);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = shop ? await sellerApi.updateShop(form) : await sellerApi.createShop(form);
      setShop(response.data);
      setForm({ ...EMPTY_SHOP, ...response.data });
      if (media.logo || media.cover) {
        const mediaResponse = await sellerApi.uploadShopMedia(media);
        setShop(mediaResponse.data);
        setMedia({ logo: null, cover: null });
      }
      showToast(shop ? 'Shop profile updated' : 'Shop profile submitted for review');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader label="Loading shop profile…" />;

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Shop profile</h2><p className="muted small">Manage the information customers see on your storefront.</p></div>{shop && <StatusBadge status={shop.status} type="shop" />}</div>
      <form className="card card-pad-lg form" onSubmit={submit}>
        <div className="form-row"><div className="field"><label htmlFor="shopName">Shop name</label><input id="shopName" minLength="3" maxLength="80" value={form.name} onChange={(event) => setField('name', event.target.value)} required /></div><div className="field"><label htmlFor="category">Category</label><input id="category" maxLength="60" value={form.category} onChange={(event) => setField('category', event.target.value)} /></div></div>
        <div className="field"><label htmlFor="description">Description</label><textarea id="description" maxLength="1200" rows="4" value={form.description} onChange={(event) => setField('description', event.target.value)} /></div>
        <div className="form-row"><div className="field"><label htmlFor="city">City</label><input id="city" maxLength="60" value={form.city} onChange={(event) => setField('city', event.target.value)} /></div><div className="field"><label htmlFor="address">Address</label><input id="address" value={form.address} onChange={(event) => setField('address', event.target.value)} /></div></div>
        <div className="form-row"><div className="field"><label htmlFor="phone">Phone</label><input id="phone" value={form.phone} onChange={(event) => setField('phone', event.target.value)} /></div><div className="field"><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" value={form.whatsapp} onChange={(event) => setField('whatsapp', event.target.value)} /></div><div className="field"><label htmlFor="openHours">Opening hours</label><input id="openHours" value={form.openHours} onChange={(event) => setField('openHours', event.target.value)} /></div></div>
        <div className="form-row"><div className="field"><label htmlFor="instagram">Instagram URL</label><input id="instagram" type="url" value={form.instagram} onChange={(event) => setField('instagram', event.target.value)} /></div><div className="field"><label htmlFor="website">Website URL</label><input id="website" type="url" value={form.website} onChange={(event) => setField('website', event.target.value)} /></div></div>
        <div className="form-row"><div className="field"><label htmlFor="logo">Logo image</label><input id="logo" type="file" accept="image/*" onChange={(event) => setMedia((current) => ({ ...current, logo: event.target.files?.[0] || null }))} /></div><div className="field"><label htmlFor="cover">Cover image</label><input id="cover" type="file" accept="image/*" onChange={(event) => setMedia((current) => ({ ...current, cover: event.target.files?.[0] || null }))} /></div></div>
        <div className="row"><button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : shop ? 'Save profile' : 'Create shop'}</button>{shop?.slug && <Link className="btn btn-light" to={`/shops/${shop.slug}`}>View storefront</Link>}</div>
      </form>
    </div>
  );
};

export default SellerShopPage;