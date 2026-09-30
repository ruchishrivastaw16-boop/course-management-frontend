import { useState } from 'react';
import {
  LayoutDashboard, UserCog, CheckSquare, BarChart3,
  Search, Plus, Edit, Trash2, Ban, CheckCircle, X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import type { User } from '../../types/index';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

// ─── API calls ─────────────────────────────────
const userService = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get('/admin/users/');
    return data;
  },
  create: async (payload: any): Promise<User> => {
    const { data } = await api.post('/admin/users/', payload);
    return data;
  },
  updateRole: async (id: number, role: string) => {
    const { data } = await api.put(`/admin/users/${id}/role`, null, {
      params: { new_role: role },
    });
    return data;
  },
  suspend: async (id: number) => {
    const { data } = await api.put(`/admin/users/${id}/suspend`);
    return data;
  },
  delete: async (id: number) => {
    await api.delete(`/admin/users/${id}`);
  },
};

export default function UserManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' });

  // ─── Fetch users ─────────────────────────────
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAll,
  });

  // ─── Mutations ───────────────────────────────
  const createUser = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      toast.success('User created');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setShowModal(false);
      setForm({ full_name: '', email: '', password: '', role: 'student' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => userService.updateRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const suspendUser = useMutation({
    mutationFn: userService.suspend,
    onSuccess: () => {
      toast.success('User suspended');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // ─── Filter ──────────────────────────────────
  const filtered = (users || []).filter((u) => {
    if (
      search &&
      !u.full_name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  // ─── Stats ───────────────────────────────────
  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === 'admin').length || 0,
    instructors: users?.filter((u) => u.role === 'instructor').length || 0,
    students: users?.filter((u) => u.role === 'student').length || 0,
  };

  return (
    <DashboardLayout links={links} title="User Management">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="student">Student</option>
          </select>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Admins', value: stats.admins, color: 'bg-purple-50 text-purple-700' },
          { label: 'Instructors', value: stats.instructors, color: 'bg-blue-50 text-blue-700' },
          { label: 'Students', value: stats.students, color: 'bg-green-50 text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-75">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load users
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <UserCog className="mx-auto text-gray-300 mb-3" size={48} />
          <p>No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-gray-800">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'instructor'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <option value="student">student</option>
                      <option value="instructor">instructor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
                      <CheckCircle size={12} /> active
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => suspendUser.mutate(u.id)}
                        title="Suspend"
                      >
                        <Ban size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete "${u.full_name}"?`)) deleteUser.mutate(u.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New User</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => createUser.mutate(form)}
                  loading={createUser.isPending}
                  className="flex-1"
                >
                  Create User
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}