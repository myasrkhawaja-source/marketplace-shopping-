import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import { useToast } from '../../hooks/useToast';

const EMPTY_CATEGORY = { name: '', description: '', icon: '', kind: 'both', sortOrder: 0, isActive: true };

const AdminCategoriesPage = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const response = await adminApi.categories({ all: true }); setCategories(response.data); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await adminApi.updateCategory(editingId, { ...form, sortOrder: Number(form.sortOrder) });
      else await adminApi.createCategory({ ...form, sortOrder: Number(form.sortOrder) });
      showToast(editingId ? 'Category updated' : 'Category created');
      setForm(EMPTY_CATEGORY);
      setEditingId(null);
      load();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setSaving(false); }
  };
  const remove = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return;
    try { await adminApi.deleteCategory(category._id); showToast('Category deleted'); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Categories</h2><p className="muted small">Organize the product and service catalogue.</p></div></div>
      <form className="card card-pad-lg form" onSubmit={submit}>
        <h3>{editingId ? 'Edit category' : 'Add category'}</h3>
        <div className="form-row"><div className="field"><label htmlFor="categoryName">Name</label><input id="categoryName" minLength="2" maxLength="50" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></div><div className="field"><label htmlFor="categoryIcon">Icon</label><input id="categoryIcon" maxLength="8" value={form.icon} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} /></div><div className="field"><label htmlFor="categoryKind">Applies to</label><select id="categoryKind" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}><option value="both">Products &amp; services</option><option value="product">Products</option><option value="service">Services</option></select></div><div className="field"><label htmlFor="sortOrder">Sort order</label><input id="sortOrder" type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} /></div></div>
        <div className="field"><label htmlFor="categoryDescription">Description</label><textarea id="categoryDescription" maxLength="500" rows="2" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
        <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />Active</label>
        <div className="row"><button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save category' : 'Create category'}</button>{editingId && <button type="button" className="btn btn-light" onClick={() => { setEditingId(null); setForm(EMPTY_CATEGORY); }}>Cancel edit</button>}</div>
      </form>
      {loading ? <Loader label="Loading categories…" /> : categories.length === 0 ? <EmptyState title="No categories yet" message="Create a category to organize listings." /> : <div className="table-wrap"><table className="table"><thead><tr><th>Category</th><th>Type</th><th>Products</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category._id}><td>{category.icon} {category.name}<br /><span className="muted small">{category.description}</span></td><td>{category.kind}</td><td>{category.productsCount || 0}</td><td>{category.sortOrder}</td><td>{category.isActive ? 'Active' : 'Inactive'}</td><td><div className="table-actions"><button type="button" className="btn btn-light btn-sm" onClick={() => { setEditingId(category._id); setForm({ ...EMPTY_CATEGORY, ...category }); }}>Edit</button><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(category)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </div>
  );
};

export default AdminCategoriesPage;