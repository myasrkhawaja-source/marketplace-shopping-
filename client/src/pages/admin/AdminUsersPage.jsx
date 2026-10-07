import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../config/constants';
import { useToast } from '../../hooks/useToast';

const AdminUsersPage = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const response = await adminApi.users(filters); setUsers(response.data); setMeta(response.meta); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters]);

  const updateUser = async (user, payload) => {
    try { await adminApi.updateUser(user._id, payload); showToast('User updated'); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };
  const deleteUser = async (user) => {
    if (!window.confirm(`Delete account for ${user.name}?`)) return;
    try { await adminApi.deleteUser(user._id); showToast('User deleted'); load(); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h2>Users &amp; sellers</h2><p className="muted small">{meta?.total ?? 0} accounts</p></div></div>
      <div className="toolbar"><input aria-label="Search users" placeholder="Name, email or phone…" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} /><select aria-label="Filter by role" value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}><option value="">All roles</option><option value="customer">Customer</option><option value="seller">Seller</option><option value="admin">Admin</option></select><select aria-label="Filter by account status" value={filters.isActive} onChange={(event) => setFilters((current) => ({ ...current, isActive: event.target.value, page: 1 }))}><option value="">All account states</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
      {loading ? <Loader label="Loading users…" /> : users.length === 0 ? <EmptyState title="No users found" message="Try another search or filter." /> : <>
        <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Account</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td><select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => updateUser(user, { role: event.target.value })}><option value="customer">Customer</option><option value="seller">Seller</option><option value="admin">Admin</option></select></td><td>{formatDate(user.createdAt)}</td><td>{user.isActive ? 'Active' : 'Inactive'}</td><td><div className="table-actions"><button type="button" className="btn btn-light btn-sm" onClick={() => updateUser(user, { isActive: !user.isActive })}>{user.isActive ? 'Deactivate' : 'Activate'}</button><button type="button" className="btn btn-outline btn-sm" onClick={() => deleteUser(user)}>Delete</button></div></td></tr>)}</tbody></table></div>
        <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
      </>}
    </div>
  );
};

export default AdminUsersPage;