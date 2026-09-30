import {
  LayoutDashboard, UserCog, CheckSquare, BarChart3,
  Users, BookOpen, DollarSign, TrendingUp, Award, RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import type { User, Course, Enrollment } from '../../types/index';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

// ─── API calls ─────────────────────────────────
const reportService = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/admin/users/');
    return data;
  },
  getEnrollments: async (): Promise<Enrollment[]> => {
    const { data } = await api.get('/admin/enrollments/');
    return data;
  },
  getPendingCourses: async (): Promise<Course[]> => {
    const { data } = await api.get('/admin/courses/pending');
    return data;
  },
  getAllCourses: async (): Promise<Course[]> => {
    const { data } = await api.get('/admin/courses/all');
    return data;
  },
};

export default function Reports() {
  const { data: users, isLoading: l1 } = useQuery({
    queryKey: ['report-users'],
    queryFn: reportService.getUsers,
  });

  const { data: enrollments, isLoading: l2 } = useQuery({
    queryKey: ['report-enrollments'],
    queryFn: reportService.getEnrollments,
  });

  const { data: pendingCourses, isLoading: l3 } = useQuery({
    queryKey: ['report-pending'],
    queryFn: reportService.getPendingCourses,
  });

  const { data: allCourses, isLoading: l4 } = useQuery({
    queryKey: ['report-courses'],
    queryFn: reportService.getAllCourses,
  });

  const isLoading = l1 || l2 || l3 || l4;

  // ─── Computed stats ──────────────────────────
  const totalUsers = users?.length || 0;
  const totalCourses = allCourses?.length || 0;
  const totalEnrollments = enrollments?.length || 0;
  const totalPending = pendingCourses?.length || 0;

  const totalRevenue =
    allCourses?.reduce((sum, c) => {
      if (c.is_free) return sum;
      return sum + c.price * (c.students_count || 0);
    }, 0) || 0;

  // Top 5 courses by students
  const topCourses = [...(allCourses || [])]
    .sort((a, b) => (b.students_count || 0) - (a.students_count || 0))
    .slice(0, 5);

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  allCourses?.forEach((c) => {
    const cat = c.category || 'Uncategorized';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const categories = Object.entries(categoryCount)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalCourses) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // User role breakdown
  const roleStats = {
    admins: users?.filter((u) => u.role === 'admin').length || 0,
    instructors: users?.filter((u) => u.role === 'instructor').length || 0,
    students: users?.filter((u) => u.role === 'student').length || 0,
  };

  // Fake monthly data (visualization ke liye)
  const enrollmentData = [
    { month: 'Sep', value: Math.round(totalEnrollments * 0.1) },
    { month: 'Oct', value: Math.round(totalEnrollments * 0.15) },
    { month: 'Nov', value: Math.round(totalEnrollments * 0.12) },
    { month: 'Dec', value: Math.round(totalEnrollments * 0.2) },
    { month: 'Jan', value: Math.round(totalEnrollments * 0.18) },
    { month: 'Feb', value: totalEnrollments },
  ];
  const maxEnroll = Math.max(...enrollmentData.map((d) => d.value), 1);

  const revenueData = [
    { month: 'Sep', value: Math.round(totalRevenue * 0.08) },
    { month: 'Oct', value: Math.round(totalRevenue * 0.15) },
    { month: 'Nov', value: Math.round(totalRevenue * 0.1) },
    { month: 'Dec', value: Math.round(totalRevenue * 0.22) },
    { month: 'Jan', value: Math.round(totalRevenue * 0.2) },
    { month: 'Feb', value: totalRevenue },
  ];
  const maxRevenue = Math.max(...revenueData.map((d) => d.value), 1);

  if (isLoading) return <DashboardLayout links={links} title="Reports"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout links={links} title="Reports & Analytics">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          subtext={`${roleStats.students} students`}
          color="indigo"
        />
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={totalCourses}
          subtext={`${totalPending} pending`}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtext="All-time"
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          label="Enrollments"
          value={totalEnrollments}
          subtext="All courses"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enrollment Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-1">Monthly Enrollments</h3>
          <p className="text-xs text-gray-500 mb-4">Last 6 months (simulated)</p>
          <div className="flex items-end justify-between gap-3 h-48">
            {enrollmentData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-medium text-gray-600">{d.value}</div>
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(d.value / maxEnroll) * 100}%`, minHeight: '4px' }}
                />
                <div className="text-xs text-gray-500">{d.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-500 mb-4">Last 6 months (simulated)</p>
          <div className="flex items-end justify-between gap-3 h-48">
            {revenueData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-medium text-gray-600">
                  ${(d.value / 1000).toFixed(1)}k
                </div>
                <div
                  className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(d.value / maxRevenue) * 100}%`, minHeight: '4px' }}
                />
                <div className="text-xs text-gray-500">{d.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Award className="text-yellow-500" size={18} />
            <h3 className="font-bold text-gray-800">Top Performing Courses</h3>
          </div>
          {topCourses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No courses yet</div>
          ) : (
            <div className="divide-y">
              {topCourses.map((c, i) => (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                  <span className={`text-lg font-bold w-6 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-400'}`}>
                    #{i + 1}
                  </span>
                  <img
                    src={c.thumbnail || 'https://via.placeholder.com/40'}
                    className="w-10 h-10 rounded object-cover"
                    alt={c.title}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 truncate">{c.instructor_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{c.students_count}</p>
                    <p className="text-xs text-gray-500">students</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={18} />
            <h3 className="font-bold text-gray-800">Courses by Category</h3>
          </div>
          <div className="p-5 space-y-4">
            {categories.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No data</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{cat.name}</span>
                    <span className="text-gray-500">
                      {cat.count} ({cat.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Users Breakdown */}
      <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Users className="text-indigo-600" size={18} />
          <h3 className="font-bold text-gray-800">User Distribution</h3>
        </div>
        <div className="grid grid-cols-3 divide-x">
          <div className="p-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{roleStats.admins}</p>
            <p className="text-sm text-gray-500 mt-1">Admins</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalUsers > 0 ? Math.round((roleStats.admins / totalUsers) * 100) : 0}% of total
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{roleStats.instructors}</p>
            <p className="text-sm text-gray-500 mt-1">Instructors</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalUsers > 0 ? Math.round((roleStats.instructors / totalUsers) * 100) : 0}% of total
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{roleStats.students}</p>
            <p className="text-sm text-gray-500 mt-1">Students</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalUsers > 0 ? Math.round((roleStats.students / totalUsers) * 100) : 0}% of total
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Stat Card Component ─────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtext?: string;
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
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}