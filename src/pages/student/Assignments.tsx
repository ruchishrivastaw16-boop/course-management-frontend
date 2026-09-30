import { useState } from 'react';
import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  Clock, CheckCircle, Upload, AlertCircle, Eye, Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import api from '../../services/api';
import type { Assignment, Submission } from '../../types/index';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
];

// ─── API calls ─────────────────────────────────
const assignmentService = {
  getMySubmissions: async (): Promise<Submission[]> => {
    const { data } = await api.get('/submissions/my');
    return data;
  },
};

type Filter = 'all' | 'pending' | 'submitted' | 'graded';

// Since backend may not have /assignments/my yet, use mock for assignments
// Ye structure suggest karta hai backend mein assignments list ka endpoint
const useMyAssignments = () => {
  return useQuery({
    queryKey: ['my-assignments'],
    queryFn: async () => {
      try {
        // Try real endpoint
        const { data } = await api.get('/assignments/my');
        return data as Assignment[];
      } catch {
        // Fallback: empty list
        return [] as Assignment[];
      }
    },
  });
};

export default function Assignments() {
  const [filter, setFilter] = useState<Filter>('all');

  const { data: assignments, isLoading: l1 } = useMyAssignments();
  const { data: submissions, isLoading: l2 } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: assignmentService.getMySubmissions,
  });

  const isLoading = l1 || l2;

  // Merge assignments with submission status
  const merged = (assignments || []).map((a) => {
    const sub = submissions?.find((s) => s.assignment_id === a.id);
    return {
      ...a,
      submission: sub,
      status: sub
        ? sub.status === 'graded'
          ? 'graded'
          : 'submitted'
        : ('pending' as const),
    };
  });

  // Filter
  const filtered = merged.filter((a) => filter === 'all' || a.status === filter);

  // Counts
  const counts = {
    all: merged.length,
    pending: merged.filter((a) => a.status === 'pending').length,
    submitted: merged.filter((a) => a.status === 'submitted').length,
    graded: merged.filter((a) => a.status === 'graded').length,
  };

  const handleSubmit = (assignmentId: number, title: string) => {
    toast.success(`Submission dialog for "${title}" — demo`);
    // TODO: Open modal with file upload
  };

  return (
    <DashboardLayout links={links} title="My Assignments">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'submitted', 'graded'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span
              className={`ml-2 text-xs ${
                filter === f ? 'opacity-90' : 'opacity-60'
              }`}
            >
              ({counts[f]})
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={56} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {filter === 'all'
              ? 'No assignments yet'
              : `No ${filter} assignments`}
          </h3>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'Assignments from your enrolled courses will appear here.'
              : 'Try selecting a different filter.'}
          </p>
        </div>
      )}

      {/* Assignments List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((a) => {
            const dueDate = a.due_date ? new Date(a.due_date) : null;
            const isOverdue =
              dueDate && dueDate < new Date() && a.status === 'pending';
            const daysLeft = dueDate
              ? Math.ceil(
                  (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {a.title}
                      </h3>
                      <StatusBadge status={a.status} />
                      {isOverdue && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                          <AlertCircle size={11} /> Overdue
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {a.description || 'No description'}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      {dueDate && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-medium' : ''
                          }`}
                        >
                          <Calendar size={12} />
                          Due: {dueDate.toLocaleDateString()}
                          {!isOverdue && daysLeft !== null && daysLeft >= 0 && (
                            <span className="text-gray-400">
                              ({daysLeft} days left)
                            </span>
                          )}
                        </span>
                      )}
                      <span>🎯 Max Score: {a.max_score}</span>
                      {a.submission?.grade !== undefined &&
                        a.submission.grade !== null && (
                          <span className="text-green-600 font-medium">
                            ✅ Grade: {a.submission.grade}/{a.max_score}
                          </span>
                        )}
                    </div>

                    {/* Feedback */}
                    {a.submission?.feedback && (
                      <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-xs text-gray-700 border-l-2 border-indigo-500">
                        <p className="font-medium text-indigo-800 mb-1">
                          Instructor Feedback:
                        </p>
                        <p>{a.submission.feedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Right — Actions */}
                  <div className="flex md:flex-col gap-2 md:min-w-[140px]">
                    {a.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(a.id, a.title)}
                      >
                        <Upload size={14} /> Submit
                      </Button>
                    )}
                    {a.status === 'submitted' && (
                      <Button size="sm" variant="outline">
                        <Eye size={14} /> View Submission
                      </Button>
                    )}
                    {a.status === 'graded' && (
                      <Button size="sm" variant="outline">
                        <Eye size={14} /> View Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Status Badge ────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      color: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
      label: 'Pending',
    },
    submitted: {
      color: 'bg-blue-100 text-blue-700',
      icon: Upload,
      label: 'Submitted',
    },
    graded: {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      label: 'Graded',
    },
  };

  const c = config[status as keyof typeof config] || config.pending;
  const Icon = c.icon;

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${c.color}`}
    >
      <Icon size={12} /> {c.label}
    </span>
  );
}