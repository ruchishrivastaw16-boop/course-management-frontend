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

export default function Enrollments() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const { data } = await api.get('/admin/enrollments/');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/enrollments/${id}`);
    },
    onSuccess: () => {
      toast.success('Enrollment deleted');
      qc.invalidateQueries({ queryKey: ['admin-enrollments'] });
    },
  });

  const filtered = (enrollments || []).filter((e: any) => {
    if (
      search &&
      !e.student_name?.toLowerCase().includes(search.toLowerCase()) &&
      !e.course_title?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    total: enrollments?.length || 0,
    active: enrollments?.filter((e: any) => e.status === 'active').length || 0,
    completed: enrollments?.filter((e: any) => e.status === 'completed').length || 0,
    dropped: enrollments?.filter((e: any) => e.status === 'dropped').length || 0,
  };

  return (
    <DashboardLayout links={links} title="Enrollments">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <p className="text-xs font-medium opacity-75">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-blue-50 text-blue-700">
          <p className="text-xs font-medium opacity-75">Active</p>
          <p className="text-2xl font-bold">{stats.active}</p>
        </div>
        <div className="rounded-xl p-4 bg-green-50 text-green-700">
          <p className="text-xs font-medium opacity-75">Completed</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="rounded-xl p-4 bg-gray-50 text-gray-700">
          <p className="text-xs font-medium opacity-75">Dropped</p>
          <p className="text-2xl font-bold">{stats.dropped}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or course..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <GraduationCap className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No enrollments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Progress</th>
                <th className="text-left px-5 py-3">Enrolled</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: any) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                        {e.student_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-gray-800">
                        {e.student_name || `Student #${e.student_id}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {e.course_title || `Course #${e.course_id}`}
                  </td>
                  <td className="px-5 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${e.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-9">
                        {e.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        e.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : e.status === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => {
                        if (confirm('Delete this enrollment?')) {
                          deleteMutation.mutate(e.id);
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