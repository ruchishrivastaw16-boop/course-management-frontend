import { useState } from 'react';
import {
  LayoutDashboard, UserCog, CheckSquare, BookOpen,
  GraduationCap, FileText, ClipboardCheck, DollarSign,
  Bell, BarChart3,
  Search, Eye, Trash2, X, Download, CheckCircle,
  Clock, ExternalLink, Save,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
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

interface Submission {
  id: number;
  assignment_id: number;
  assignment_title?: string;
  course_id?: number;
  course_title?: string;
  max_score?: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  file_url?: string;
  text_answer?: string;
  grade?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  graded_at?: string;
}

export default function Submissions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Submission | null>(null);
  const qc = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: async () => {
      const { data } = await api.get('/admin/submissions/');
      return data as Submission[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/submissions/${id}`);
    },
    onSuccess: () => {
      toast.success('Submission deleted');
      qc.invalidateQueries({ queryKey: ['admin-submissions'] });
      setSelected(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    },
  });

  const filtered = (submissions || []).filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        s.student_name?.toLowerCase().includes(q) ||
        s.student_email?.toLowerCase().includes(q) ||
        s.assignment_title?.toLowerCase().includes(q) ||
        s.course_title?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const stats = {
    total: submissions?.length || 0,
    submitted: submissions?.filter((s) => s.status === 'submitted').length || 0,
    graded: submissions?.filter((s) => s.status === 'graded').length || 0,
    late: submissions?.filter((s) => s.status === 'late').length || 0,
  };

  return (
    <DashboardLayout links={links} title="All Submissions">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <p className="text-xs font-medium opacity-75">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-blue-50 text-blue-700">
          <p className="text-xs font-medium opacity-75">Pending Grade</p>
          <p className="text-2xl font-bold">{stats.submitted}</p>
        </div>
        <div className="rounded-xl p-4 bg-green-50 text-green-700">
          <p className="text-xs font-medium opacity-75">Graded</p>
          <p className="text-2xl font-bold">{stats.graded}</p>
        </div>
        <div className="rounded-xl p-4 bg-red-50 text-red-700">
          <p className="text-xs font-medium opacity-75">Late</p>
          <p className="text-2xl font-bold">{stats.late}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, assignment, or course..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses ({stats.total})</option>
          <option value="submitted">Submitted ({stats.submitted})</option>
          <option value="graded">Graded ({stats.graded})</option>
          <option value="late">Late ({stats.late})</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No submissions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Submission</th>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Assignment</th>
                <th className="text-left px-5 py-3">Grade</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Submitted</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500">#{s.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                        {s.student_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs">
                          {s.student_name || `Student #${s.student_id}`}
                        </p>
                        <p className="text-xs text-gray-500">{s.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 text-xs">
                      {s.assignment_title || `Assignment #${s.assignment_id}`}
                    </p>
                    {s.course_title && (
                      <p className="text-xs text-gray-500">{s.course_title}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {s.grade !== null && s.grade !== undefined ? (
                      <span className="font-medium">
                        {s.grade}
                        {s.max_score ? `/${s.max_score}` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {s.submitted_at
                      ? new Date(s.submitted_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSelected(s)}
                        className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete submission #${s.id}?`)) {
                            deleteMutation.mutate(s.id);
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

      {/* Detail Modal */}
      {selected && (
        <SubmissionDetailModal
          submission={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBMISSION DETAIL MODAL
// ═══════════════════════════════════════════════════════════
function SubmissionDetailModal({
  submission,
  onClose,
  onDelete,
}: {
  submission: Submission;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  const qc = useQueryClient();
  const [grade, setGrade] = useState<number | ''>(
    submission.grade !== null && submission.grade !== undefined
      ? submission.grade
      : ''
  );
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [saving, setSaving] = useState(false);

  const saveGradeMutation = useMutation({
    mutationFn: async (payload: { grade: number; feedback: string }) => {
      const { data } = await api.put(
        `/instructor/submissions/${submission.id}/grade`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Grade saved!');
      qc.invalidateQueries({ queryKey: ['admin-submissions'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save grade');
    },
  });

  const handleSave = () => {
    if (grade === '' || grade === null) {
      toast.error('Please enter a grade');
      return;
    }
    if (typeof grade === 'number' && grade < 0) {
      toast.error('Grade cannot be negative');
      return;
    }
    if (submission.max_score && grade > submission.max_score) {
      toast.error(`Grade cannot exceed ${submission.max_score}`);
      return;
    }
    saveGradeMutation.mutate({ grade, feedback });
  };

  const isGraded = submission.status === 'graded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Submission Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              #{submission.id} · {submission.student_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoBox label="Student" value={submission.student_name || '—'} />
            <InfoBox label="Email" value={submission.student_email || '—'} />
            <InfoBox label="Status" value={<StatusBadge status={submission.status} />} />
            <InfoBox label="Assignment" value={submission.assignment_title || '—'} />
            <InfoBox label="Course" value={submission.course_title || '—'} />
            <InfoBox
              label="Submitted"
              value={
                submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleString()
                  : '—'
              }
            />
          </div>

          {/* Submitted File */}
          {submission.file_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                SUBMITTED FILE
              </p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <FileText className="text-indigo-600 shrink-0" size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {submission.file_url.split('/').pop() || 'file'}
                  </p>
                  <p className="text-xs text-gray-500">Click to download</p>
                </div>
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Text Answer */}
          {submission.text_answer && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                STUDENT'S ANSWER
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {submission.text_answer}
                </p>
              </div>
            </div>
          )}

          {/* Grade Section */}
          <div className="border-t pt-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              {isGraded ? 'Update Grade' : 'Grade Submission'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Grade {submission.max_score ? `(max ${submission.max_score})` : ''}
                </label>
                <input
                  type="number"
                  value={grade}
                  onChange={(e) =>
                    setGrade(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  min={0}
                  max={submission.max_score}
                  step={0.5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Feedback (optional)
                </label>
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                  placeholder="Great work! / Needs improvement on..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleSave}
                loading={saveGradeMutation.isPending}
              >
                <Save size={16} /> Save Grade
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    confirm(
                      `Delete submission #${submission.id}? This cannot be undone.`
                    )
                  ) {
                    onDelete(submission.id);
                  }
                }}
              >
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════
function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    submitted: {
      color: 'bg-blue-100 text-blue-700',
      icon: Clock,
      label: 'Submitted',
    },
    graded: {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      label: 'Graded',
    },
    late: {
      color: 'bg-red-100 text-red-700',
      icon: Clock,
      label: 'Late',
    },
    resubmit: {
      color: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
      label: 'Resubmit',
    },
  };

  const c = config[status as keyof typeof config] || config.submitted;
  const Icon = c.icon;

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${c.color}`}
    >
      <Icon size={12} /> {c.label}
    </span>
  );
}