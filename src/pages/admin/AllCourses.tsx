import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, UserCog, CheckSquare, BookOpen,
  GraduationCap, FileText, ClipboardCheck, DollarSign,
  Bell, BarChart3,
  Search, Eye, Trash2, CheckCircle, XCircle,
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

export default function AllCourses() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-all-courses'],
    queryFn: async () => {
      const { data } = await api.get('/admin/courses/all');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/courses/${id}`);
    },
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['admin-all-courses'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/admin/courses/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      toast.success('Course approved & published');
      qc.invalidateQueries({ queryKey: ['admin-all-courses'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/admin/courses/${id}/reject`);
      return data;
    },
    onSuccess: () => {
      toast.success('Course rejected');
      qc.invalidateQueries({ queryKey: ['admin-all-courses'] });
    },
  });

  const filtered = (courses || []).filter((c: any) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (
      search &&
      !c.title?.toLowerCase().includes(search.toLowerCase()) &&
      !c.instructor_name?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const statusCounts = {
    all: courses?.length || 0,
    pending: courses?.filter((c: any) => c.status === 'pending').length || 0,
    published: courses?.filter((c: any) => c.status === 'published').length || 0,
    rejected: courses?.filter((c: any) => c.status === 'rejected').length || 0,
    draft: courses?.filter((c: any) => c.status === 'draft').length || 0,
  };

  return (
    <DashboardLayout links={links} title="All Courses">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or instructor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">All ({statusCounts.all})</option>
          <option value="pending">Pending ({statusCounts.pending})</option>
          <option value="published">Published ({statusCounts.published})</option>
          <option value="rejected">Rejected ({statusCounts.rejected})</option>
          <option value="draft">Draft ({statusCounts.draft})</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          No courses found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Instructor</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Price</th>
                <th className="text-left px-5 py-3">Students</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.thumbnail || 'https://via.placeholder.com/40'}
                        className="w-10 h-10 rounded object-cover"
                        alt=""
                      />
                      <div>
                        <p className="font-medium text-gray-800">{c.title}</p>
                        <p className="text-xs text-gray-500">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.instructor_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.category || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {c.is_free ? <span className="text-green-600">Free</span> : `$${c.price}`}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.students_count || 0}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        c.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : c.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link to={`/courses/${c.slug}`} title="View">
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                          <Eye size={14} />
                        </button>
                      </Link>
                      {c.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(c.id)}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(c.id)}
                            className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${c.title}"?`)) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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