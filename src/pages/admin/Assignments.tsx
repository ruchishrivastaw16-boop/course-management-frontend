import { useState } from 'react';
import {
  LayoutDashboard, UserCog, CheckSquare, BookOpen,
  GraduationCap, FileText, ClipboardCheck, DollarSign,
  Bell, BarChart3,
  Search, Trash2,
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

export default function Assignments() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['admin-assignments'],
    queryFn: async () => {
      const { data } = await api.get('/admin/assignments/');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/assignments/${id}`);
    },
    onSuccess: () => {
      toast.success('Assignment deleted');
      qc.invalidateQueries({ queryKey: ['admin-assignments'] });
    },
  });

  const filtered = (assignments || []).filter((a: any) => {
    if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout links={links} title="All Assignments">
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <ClipboardCheck className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No assignments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Assignment</th>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Max Score</th>
                <th className="text-left px-5 py-3">Due Date</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{a.title}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {a.course_title || `Course #${a.course_id}`}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{a.max_score}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${a.title}"?`)) {
                          deleteMutation.mutate(a.id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
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