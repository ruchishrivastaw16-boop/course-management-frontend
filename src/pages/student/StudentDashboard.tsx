import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  BookOpen, Award, TrendingUp, Clock, PlayCircle, User as UserIcon,
  Calendar, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
  { to: '/student/profile', label: 'Profile', icon: UserIcon },
];

// ═══════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════
const dashboardService = {
  getMyEnrollments: async (): Promise<any[]> => {
    const { data } = await api.get('/enrollments/my');
    return data;
  },
  getMyAssignments: async (): Promise<any[]> => {
    const { data } = await api.get('/assignments/my');
    return data;
  },
  getMySubmissions: async (): Promise<any[]> => {
    const { data } = await api.get('/submissions/my');
    return data;
  },
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: enrollments, isLoading: l1 } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: dashboardService.getMyEnrollments,
  });

  const { data: assignments, isLoading: l2 } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: dashboardService.getMyAssignments,
  });

  const { data: submissions, isLoading: l3 } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: dashboardService.getMySubmissions,
  });

  const isLoading = l1 || l2 || l3;

  // ─── Enrollments already have all fields (from enriched backend) ───
  const enrolledCourses = enrollments || [];

  // ─── Stats ───
  const stats = {
    total: enrolledCourses.length,
    active: enrolledCourses.filter((e: any) => e.status === 'active').length,
    completed: enrolledCourses.filter((e: any) => e.status === 'completed')
      .length,
    avgProgress:
      enrolledCourses.length > 0
        ? Math.round(
            enrolledCourses.reduce(
              (sum: number, e: any) => sum + (Number(e.progress) || 0),
              0
            ) / enrolledCourses.length
          )
        : 0,
  };

  // ─── Upcoming assignments (pending, sorted by due date) ───
  const upcomingAssignments = (assignments || [])
    .filter((a: any) => !a.submission_id)
    .sort((a: any, b: any) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  // ─── Recent submissions (newest first) ───
  const recentSubmissions = [...(submissions || [])]
    .sort(
      (a: any, b: any) =>
        new Date(b.submitted_at || 0).getTime() -
        new Date(a.submitted_at || 0).getTime()
    )
    .slice(0, 5);

  // ─── Continue learning (active courses, highest progress first) ───
  const continueLearning = [...enrolledCourses]
    .filter((e: any) => e.status !== 'dropped')
    .sort(
      (a: any, b: any) =>
        (Number(b.progress) || 0) - (Number(a.progress) || 0)
    )
    .slice(0, 3);

  if (isLoading) {
    return (
      <DashboardLayout links={links} title="Student Dashboard">
        <Spinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={links} title="Student Dashboard">
      {/* ─── Welcome Banner ─── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-1">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
        </h2>
        <p className="text-indigo-100 text-sm">
          {stats.active > 0
            ? `You have ${stats.active} active course${
                stats.active !== 1 ? 's' : ''
              }. Keep going!`
            : stats.total > 0
            ? 'Ready to start learning?'
            : 'Enroll in your first course to get started!'}
        </p>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={BookOpen}
          label="Enrolled"
          value={stats.total}
          color="indigo"
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={stats.active}
          color="yellow"
        />
        <StatCard
          icon={Award}
          label="Completed"
          value={stats.completed}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Avg Progress"
          value={`${stats.avgProgress}%`}
          color="purple"
        />
      </div>

      {/* ─── Continue Learning ─── */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Continue Learning</h2>
          <Link
            to="/student/courses"
            className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {continueLearning.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <GraduationCap className="mx-auto text-gray-300 mb-3" size={56} />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              No courses yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Start learning by enrolling in a course.
            </p>
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {continueLearning.map((e: any) => (
              <EnrollmentCard key={e.id} enrollment={e} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={18} />
              <h3 className="font-bold text-gray-800">Upcoming Assignments</h3>
            </div>
            <Link
              to="/student/assignments"
              className="text-xs text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <FileText className="mx-auto text-gray-300 mb-2" size={32} />
              <p>No pending assignments</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingAssignments.map((a: any) => {
                const dueDate = a.due_date ? new Date(a.due_date) : null;
                const daysLeft = dueDate
                  ? Math.ceil(
                      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  : null;
                const isOverdue = daysLeft !== null && daysLeft < 0;

                return (
                  <Link
                    key={a.id}
                    to="/student/assignments"
                    className="block px-6 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">
                          {a.title}
                        </p>
                        {a.course_title && (
                          <p className="text-xs text-gray-500 truncate">
                            {a.course_title}
                          </p>
                        )}
                      </div>
                      {dueDate && (
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            isOverdue ? 'text-red-600' : 'text-gray-500'
                          }`}
                        >
                          {isOverdue
                            ? 'Overdue'
                            : daysLeft === 0
                            ? 'Today'
                            : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="text-indigo-600" size={18} />
              <h3 className="font-bold text-gray-800">Recent Submissions</h3>
            </div>
            <Link
              to="/student/grades"
              className="text-xs text-indigo-600 hover:underline"
            >
              View grades
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <FileText className="mx-auto text-gray-300 mb-2" size={32} />
              <p>No submissions yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentSubmissions.map((s: any) => {
                const isGraded = s.status === 'graded';
                return (
                  <div key={s.id} className="px-6 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">
                          {s.assignment_title ||
                            `Assignment #${s.assignment_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.submitted_at
                            ? new Date(s.submitted_at).toLocaleDateString()
                            : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isGraded && s.grade !== null ? (
                          <span className="text-xs font-bold text-green-600">
                            {s.grade}/{s.max_score || 100}
                          </span>
                        ) : (
                          <span className="text-xs text-blue-600">
                            {s.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: 'indigo' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ENROLLMENT CARD
// ═══════════════════════════════════════════════════════════
function EnrollmentCard({ enrollment }: { enrollment: any }) {
  const progress = Number(enrollment.progress) || 0;

  return (
    <Link
      to={`/student/courses/${enrollment.course_id}/learn`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
        {enrollment.course_thumbnail ? (
          <img
            src={enrollment.course_thumbnail}
            alt={enrollment.course_title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <GraduationCap className="text-white" size={40} />
        )}
        {enrollment.status === 'completed' && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✓ Completed
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {enrollment.course_category && (
          <span className="text-xs font-semibold text-indigo-600">
            {enrollment.course_category}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-indigo-600 transition">
          {enrollment.course_title}
        </h3>
        {enrollment.instructor_name && (
          <p className="text-xs text-gray-500 mb-3">
            By {enrollment.instructor_name}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-3">
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

        {/* Action */}
        <Button size="sm" className="w-full">
          <PlayCircle size={14} />
          {progress > 0 ? 'Continue' : 'Start Learning'}
        </Button>
      </div>
    </Link>
  );
}