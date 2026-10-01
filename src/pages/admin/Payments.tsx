import { useState } from 'react';
import {
  LayoutDashboard, UserCog, CheckSquare, BookOpen,
  GraduationCap, FileText, ClipboardCheck, DollarSign,
  Bell, BarChart3,
  Search, RotateCcw, CreditCard,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/enrollments', label: 'Enrollments', icon: GraduationCap },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardCheck },
  { to: '/admin/submissions', label: 'Submissions', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: DollarSign },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data } = await api.get('/admin/payments/');
      return data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/admin/payments/${id}/refund`);
      return data;
    },
    onSuccess: () => {
      toast.success('Payment refunded');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
    },
  });

  const filtered = (payments || []).filter((p: any) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (
      search &&
      !String(p.transaction_id || '').toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const totalRevenue =
    payments?.reduce(
      (sum: number, p: any) => (p.status === 'success' ? sum + Number(p.amount) : sum),
      0
    ) || 0;

  const stats = {
    total: payments?.length || 0,
    success: payments?.filter((p: any) => p.status === 'success').length || 0,
    pending: payments?.filter((p: any) => p.status === 'pending').length || 0,
    refunded: payments?.filter((p: any) => p.status === 'refunded').length || 0,
  };

  return (
    <DashboardLayout links={links} title="Payments">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <p className="text-xs font-medium opacity-75">Total Transactions</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-green-50 text-green-700">
          <p className="text-xs font-medium opacity-75">Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4 bg-yellow-50 text-yellow-700">
          <p className="text-xs font-medium opacity-75">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="rounded-xl p-4 bg-red-50 text-red-700">
          <p className="text-xs font-medium opacity-75">Refunded</p>
          <p className="text-2xl font-bold">{stats.refunded}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <CreditCard className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Transaction ID</th>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Gateway</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">
                    {p.transaction_id || `#${p.id}`}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {p.student_name || `Student #${p.student_id}`}
                  </td>
                  <td className="px-5 py-3 font-medium">
                    ${Number(p.amount).toFixed(2)} {p.currency}
                  </td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{p.gateway || '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : p.status === 'refunded'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {p.status === 'success' && (
                      <button
                        onClick={() => {
                          if (confirm('Refund this payment?')) {
                            refundMutation.mutate(p.id);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <RotateCcw size={12} /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}