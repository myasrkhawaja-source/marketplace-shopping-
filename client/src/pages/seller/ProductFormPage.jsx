import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog.api';
import { sellerApi } from '../../api/seller.api';
import ImageUploader from '../../components/ImageUploader';
import Loader from '../../components/Loader';
import { useToast } from '../../hooks/useToast';

const EMPTY_PRODUCT = {
  name: '', description: '', shortDescription: '', category: '', type: 'product',
  price: '', discountPrice: '', stock: 0, durationMinutes: 60, images: [],
  tags: '', brand: '', city: '', availableDays: [],
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          catalogApi.getCategories({ all: true }),
          id ? sellerApi.myProduct(id) : Promise.resolve(null),
        ]);
        setCategories(categoryResponse.data);
        if (productResponse) {
          const product = productResponse.data;
          setForm({ ...EMPTY_PRODUCT, ...product, category: product.category?._id || product.category, tags: (product.tags || []).join(', ') });
        }
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
      stock: Number(form.stock || 0),
      durationMinutes: Number(form.durationMinutes || 60),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      if (id) await sellerApi.updateProduct(id, payload);
      else await sellerApi.createProduct(payload);
      showToast(id ? 'Listing updated' : 'Listing submitted for review');
      navigate('/seller/products');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading listing…" />;

  return (
    <div className="stack">
      <div className="page-head"><h2>{id ? 'Edit listing' : 'Add product or service'}</h2><Link className="btn btn-light btn-sm" to="/seller/products">Back to listings</Link></div>
      <form className="card card-pad-lg form" onSubmit={submit}>
        <div className="form-row">
          <div className="field"><label htmlFor="name">Name</label><input id="name" minLength="3" maxLength="120" value={form.name} onChange={(event) => setField('name', event.target.value)} required /></div>
          <div className="field"><label htmlFor="type">Listing type</label><select id="type" value={form.type} onChange={(event) => setField('type', event.target.value)}><option value="product">Physical product</option><option value="service">Service</option></select></div>
        </div>
        <div className="field"><label htmlFor="description">Description</label><textarea id="description" minLength="10" maxLength="3000" rows="5" value={form.description} onChange={(event) => setField('description', event.target.value)} required /></div>
        <div className="form-row">
          <div className="field"><label htmlFor="category">Category</label><select id="category" value={form.category} onChange={(event) => setField('category', event.target.value)} required><option value="">Choose a category</option>{categories.filter((category) => category.kind === 'both' || category.kind === form.type).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></div>
          <div className="field"><label htmlFor="price">Price</label><input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setField('price', event.target.value)} required /></div>
          <div className="field"><label htmlFor="discountPrice">Discount price</label><input id="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice ?? ''} onChange={(event) => setField('discountPrice', event.target.value)} /></div>
        </div>
        {form.type === 'product' ? (
          <div className="form-row">
            <div className="field"><label htmlFor="stock">Stock</label><input id="stock" type="number" min="0" value={form.stock} onChange={(event) => setField('stock', event.target.value)} /></div>
            <div className="field"><label htmlFor="brand">Brand</label><input id="brand" maxLength="60" value={form.brand} onChange={(event) => setField('brand', event.target.value)} /></div>
          </div>
        ) : (
          <div className="form-row">
            <div className="field"><label htmlFor="duration">Duration (minutes)</label><input id="duration" type="number" min="15" max="720" step="15" value={form.durationMinutes} onChange={(event) => setField('durationMinutes', event.target.value)} /></div>
            <fieldset className="field"><legend>Available days</legend><div className="row">{DAYS.map((day) => <label className="checkbox-field" key={day}><input type="checkbox" checked={form.availableDays.includes(day)} onChange={(event) => setField('availableDays', event.target.checked ? [...form.availableDays, day] : form.availableDays.filter((value) => value !== day))} />{day}</label>)}</div></fieldset>
          </div>
        )}
        <div className="form-row">
          <div className="field"><label htmlFor="city">City</label><input id="city" maxLength="60" value={form.city} onChange={(event) => setField('city', event.target.value)} /></div>
          <div className="field"><label htmlFor="tags">Tags</label><input id="tags" value={form.tags} onChange={(event) => setField('tags', event.target.value)} placeholder="Comma-separated tags" /></div>
        </div>
        <ImageUploader images={form.images} onChange={(images) => setField('images', images)} />
        <div className="row"><button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : id ? 'Save changes' : 'Submit for review'}</button><Link className="btn btn-light" to="/seller/products">Cancel</Link></div>
      </form>
    </div>
  );
};

export default ProductFormPage;