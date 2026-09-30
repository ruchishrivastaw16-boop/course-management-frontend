import {
  BookOpen, Award, TrendingUp, Clock,
  LayoutDashboard, GraduationCap, FileText, BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import type { Enrollment } from '../../types/index';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
];

const enrollmentService = {
  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const { data } = await api.get('/enrollments/my');
    return data;
  },
};

export default function StudentDashboard() {
  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentService.getMyEnrollments,
  });

  // Stats
  const stats = {
    total: enrollments?.length || 0,
    active: enrollments?.filter((e) => e.status === 'active').length || 0,
    completed: enrollments?.filter((e) => e.status === 'completed').length || 0,
    avgProgress:
      enrollments && enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) /
              enrollments.length
          )
        : 0,
  };

  return (
    <DashboardLayout links={links} title="Student Dashboard">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-1">Welcome back! 👋</h2>
        <p className="text-indigo-100 text-sm">
          Continue your learning journey. You have {stats.active} active courses.
        </p>
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load dashboard. Please refresh.
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Stats */}
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

          {/* Continue Learning */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Continue Learning</h2>
              <Link
                to="/student/courses"
                className="text-sm text-indigo-600 hover:underline"
              >
                View all →
              </Link>
            </div>

            {enrollments && enrollments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <GraduationCap
                  className="mx-auto text-gray-300 mb-3"
                  size={56}
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  No courses yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start learning by enrolling in a course.
                </p>
                <Link
                  to="/courses"
                  className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrollments?.slice(0, 6).map((e) => (
                  <EnrollmentCard key={e.id} enrollment={e} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {enrollments && enrollments.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Recent Enrollments
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-5 py-3">Course</th>
                      <th className="text-left px-5 py-3">Progress</th>
                      <th className="text-left px-5 py-3">Enrolled</th>
                      <th className="text-left px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.slice(0, 5).map((e) => (
                      <tr key={e.id} className="border-t hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {e.course_title}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 w-40">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600"
                                style={{ width: `${e.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-9">
                              {e.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {new Date(e.enrolled_at).toLocaleDateString()}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

// ─── Components ─────────────────────────────

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

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  return (
    <Link
      to={`/student/courses/${enrollment.course_id}/learn`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group"
    >
      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <GraduationCap className="text-white" size={40} />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-3 group-hover:text-indigo-600">
          {enrollment.course_title}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 w-9">
            {enrollment.progress}%
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span
            className={`px-2 py-1 rounded-full font-medium ${
              enrollment.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {enrollment.status}
          </span>
          <span className="text-indigo-600 font-medium group-hover:underline">
            Continue →
          </span>
        </div>
      </div>
    </Link>
  );
}