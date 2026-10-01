import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  DollarSign, CreditCard, Calendar, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
];

export default function Payments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => {
      const { data } = await api.get('/payments/my');
      return data;
    },
  });

  const totalSpent =
    payments?.reduce(
      (sum: number, p: any) =>
        p.status === 'success' ? sum + Number(p.amount) : sum,
      0
    ) || 0;

  return (
    <DashboardLayout links={links} title="Payment History">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <p className="text-xs font-medium opacity-75">Total Spent</p>
          <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4 bg-green-50 text-green-700">
          <p className="text-xs font-medium opacity-75">Successful</p>
          <p className="text-2xl font-bold">
            {payments?.filter((p: any) => p.status === 'success').length || 0}
          </p>
        </div>
        <div className="rounded-xl p-4 bg-yellow-50 text-yellow-700">
          <p className="text-xs font-medium opacity-75">Pending</p>
          <p className="text-2xl font-bold">
            {payments?.filter((p: any) => p.status === 'pending').length || 0}
          </p>
        </div>
        <div className="rounded-xl p-4 bg-gray-50 text-gray-700">
          <p className="text-xs font-medium opacity-75">Total</p>
          <p className="text-2xl font-bold">{payments?.length || 0}</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Spinner />
      ) : !payments || payments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <CreditCard className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 mb-2">No payments yet</p>
          <p className="text-xs text-gray-400">
            Your course purchases will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Transaction</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Gateway</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">
                    {p.transaction_id || `#${p.id}`}
                  </td>
                  <td className="px-5 py-3 font-medium">
                    ${Number(p.amount).toFixed(2)} {p.currency}
                  </td>
                  <td className="px-5 py-3 text-gray-600 capitalize">
                    {p.gateway || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                        p.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : p.status === 'refunded'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.status === 'success' && <CheckCircle size={12} />}
                      {p.status === 'pending' && <Clock size={12} />}
                      {p.status === 'failed' && <XCircle size={12} />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : '—'}
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