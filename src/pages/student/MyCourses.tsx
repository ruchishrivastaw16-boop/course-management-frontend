import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  Search, BookOpen, PlayCircle, CheckCircle, Clock, Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import api from '../../services/api';
import type { Enrollment } from '../../types/index';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
  { to: '/student/profile', label: 'Profile', icon: UserIcon },   // ← NAYA
]

const enrollmentService = {
  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const { data } = await api.get('/enrollments/my');
    return data;
  },
};

type Tab = 'all' | 'active' | 'completed' | 'dropped';

export default function MyCourses() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentService.getMyEnrollments,
  });

  // Filter by tab + search
  const filtered = (enrollments || []).filter((e) => {
    if (tab !== 'all' && e.status !== tab) return false;
    if (
      search &&
      !e.course_title?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // Stats
  const stats = {
    total: enrollments?.length || 0,
    active: enrollments?.filter((e) => e.status === 'active').length || 0,
    completed: enrollments?.filter((e) => e.status === 'completed').length || 0,
    dropped: enrollments?.filter((e) => e.status === 'dropped').length || 0,
  };

  return (
    <DashboardLayout links={links} title="My Courses">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox
          label="Total Enrolled"
          value={stats.total}
          color="bg-indigo-50 text-indigo-700"
          icon={BookOpen}
        />
        <StatBox
          label="Active"
          value={stats.active}
          color="bg-blue-50 text-blue-700"
          icon={PlayCircle}
        />
        <StatBox
          label="Completed"
          value={stats.completed}
          color="bg-green-50 text-green-700"
          icon={CheckCircle}
        />
        <StatBox
          label="Dropped"
          value={stats.dropped}
          color="bg-gray-50 text-gray-700"
          icon={Clock}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my courses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'completed', 'dropped'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                tab === t
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== 'all' && (
                <span className="ml-1 text-xs opacity-75">
                  ({stats[t]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load courses. Please refresh.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <GraduationCap className="mx-auto text-gray-300 mb-3" size={56} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {search || tab !== 'all'
              ? 'No courses match your filter'
              : 'No courses yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {search || tab !== 'all'
              ? 'Try changing filter or search term'
              : 'Enroll in a course to start learning'}
          </p>
          {!search && tab === 'all' && (
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          )}
        </div>
      )}

      {/* Course Grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((e) => (
            <CourseProgressCard key={e.id} enrollment={e} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatBox({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <Icon size={16} className="opacity-60" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function CourseProgressCard({ enrollment }: { enrollment: Enrollment }) {
  const qc = useQueryClient();
  const progress = enrollment.progress || 0;

  const dropMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/enrollments/${enrollment.id}`);
    },
    onSuccess: () => {
      toast.success('Course dropped');
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to drop');
    },
  });

  const handleDrop = () => {
    if (
      confirm(
        `Drop "${enrollment.course_title}"? Your progress will be lost.`
      )
    ) {
      dropMutation.mutate();
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    dropped: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group">
      {/* Header */}
      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
        <GraduationCap className="text-white opacity-90" size={48} />
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              statusColors[enrollment.status] || statusColors.dropped
            }`}
          >
            {enrollment.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-3 group-hover:text-indigo-600 transition">
          {enrollment.course_title}
        </h3>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress >= 100
                  ? 'bg-green-500'
                  : progress >= 50
                  ? 'bg-indigo-600'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="text-xs text-gray-500 mb-3">
          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
          {enrollment.completed_at && (
            <span className="block text-green-600 mt-0.5">
              ✓ Completed:{' '}
              {new Date(enrollment.completed_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {enrollment.status === 'completed' ? (
            <Link to={`/courses`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View Course
              </Button>
            </Link>
          ) : (
            <Link
              to={`/student/courses/${enrollment.course_id}/learn`}
              className="flex-1"
            >
              <Button size="sm" className="w-full">
                <PlayCircle size={14} />
                {progress > 0 ? 'Continue' : 'Start'}
              </Button>
            </Link>
          )}

          {/* Drop button */}
          <button
            onClick={handleDrop}
            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            title="Drop course"
            disabled={dropMutation.isPending}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}