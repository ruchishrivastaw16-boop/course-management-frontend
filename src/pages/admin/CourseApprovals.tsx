import { useState } from 'react';
import {
  LayoutDashboard,
  UserCog,
  CheckSquare,
  BarChart3,
  Check,
  X,
  Eye,
  Clock,
  Users,
  BookOpen,
  Star,
  GraduationCap,
  FileText,
  ClipboardCheck,
  DollarSign,
  Bell,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import type { Course } from '../../types/index';

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
// ─── API calls ─────────────────────────────────
const approvalService = {
  getPending: async (): Promise<Course[]> => {
    const { data } = await api.get('/admin/courses/pending');
    return data;
  },
  approve: async (id: number) => {
    const { data } = await api.post(`/admin/courses/${id}/approve`);
    return data;
  },
  reject: async (id: number) => {
    const { data } = await api.post(`/admin/courses/${id}/reject`);
    return data;
  },
};

export default function CourseApprovals() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<Course | null>(null);

  // ─── Fetch ───────────────────────────────────
  const { data: pending, isLoading, error } = useQuery({
    queryKey: ['pending-courses'],
    queryFn: approvalService.getPending,
    refetchInterval: 30000, // Auto-refetch every 30s
  });

  // ─── Mutations ───────────────────────────────
  const approveMutation = useMutation({
    mutationFn: approvalService.approve,
    onSuccess: () => {
      toast.success('Course approved and published ✅');
      qc.invalidateQueries({ queryKey: ['pending-courses'] });
      setPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Approval failed');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: approvalService.reject,
    onSuccess: () => {
      toast.success('Course rejected');
      qc.invalidateQueries({ queryKey: ['pending-courses'] });
      setPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Rejection failed');
    },
  });

  const handleReject = (id: number, title: string) => {
    if (confirm(`Reject "${title}"?\n\nInstructor will be notified.`)) {
      rejectMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout links={links} title="Course Approvals">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Review instructor submissions
          </span>
          {pending && (
            <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ['pending-courses'] })}
        >
          Refresh
        </Button>
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load pending courses: {(error as any).message}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && (!pending || pending.length === 0) && (
        <div className="bg-white rounded-xl p-12 text-center">
          <CheckSquare className="mx-auto text-green-500 mb-3" size={56} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            All caught up! 🎉
          </h3>
          <p className="text-sm text-gray-500">
            No pending course approvals at the moment.
          </p>
        </div>
      )}

      {/* Pending List */}
      {!isLoading && pending && pending.length > 0 && (
        <div className="space-y-4">
          {pending.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition"
            >
              {/* Thumbnail */}
              <img
                src={c.thumbnail || 'https://via.placeholder.com/300x200'}
                alt={c.title}
                className="w-full md:w-48 h-32 object-cover rounded-lg"
              />

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {c.category || 'Uncategorized'}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {c.level}
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Clock size={11} /> pending
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-800">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-3 line-clamp-2">
                  {c.description}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    👨‍🏫 {c.instructor_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {c.duration_hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> {c.lessons_count} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    💰 {c.is_free ? 'Free' : `$${c.price}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500" /> {c.rating}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 md:justify-center md:min-w-[140px]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreview(c)}
                >
                  <Eye size={14} /> Preview
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate(c.id)}
                  loading={approveMutation.isPending}
                >
                  <Check size={14} /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleReject(c.id, c.title)}
                  loading={rejectMutation.isPending}
                >
                  <X size={14} /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPreview(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Course Preview</h3>
              <button
                onClick={() => setPreview(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <img
                src={preview.thumbnail}
                alt={preview.title}
                className="w-full h-48 object-cover rounded-lg"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {preview.category}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {preview.level}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-800">{preview.title}</h2>
              <p className="text-gray-600">{preview.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Instructor</p>
                  <p className="font-medium">{preview.instructor_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Category</p>
                  <p className="font-medium">{preview.category}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Duration</p>
                  <p className="font-medium">{preview.duration_hours} hours</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Lessons</p>
                  <p className="font-medium">{preview.lessons_count}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Level</p>
                  <p className="font-medium capitalize">{preview.level}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Price</p>
                  <p className="font-medium">
                    {preview.is_free ? 'Free' : `$${preview.price}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate(preview.id)}
                loading={approveMutation.isPending}
              >
                <Check size={16} /> Approve & Publish
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(preview.id, preview.title)}
                loading={rejectMutation.isPending}
              >
                <X size={16} /> Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}