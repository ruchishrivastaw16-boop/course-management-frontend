import { Users, BookOpen, DollarSign, AlertCircle, LayoutDashboard, UserCog, CheckSquare, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/charts/StatsCard';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { usePendingCourses, useApproveCourse } from '../../hooks/useCourses';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function AdminDashboard() {
  const { data: pending, isLoading } = usePendingCourses();
  const approveCourse = useApproveCourse();

  return (
    <DashboardLayout links={links} title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatsCard icon={Users} label="Total Users" value="1.2K" color="indigo" />
        <StatsCard icon={BookOpen} label="Total Courses" value="85" color="green" />
        <StatsCard icon={DollarSign} label="Revenue" value="$12,340" color="yellow" />
        <StatsCard icon={AlertCircle} label="Pending" value={pending?.length || 0} color="red" />
      </div>

      <h2 className="text-xl font-bold mb-4">Pending Course Approvals</h2>
      {isLoading ? (
        <Spinner />
      ) : !pending || pending.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          No pending courses 🎉
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Instructor</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{c.title}</td>
                  <td className="px-5 py-3 text-gray-600">{c.instructor_name}</td>
                  <td className="px-5 py-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approveCourse.mutate(c.id)}
                      loading={approveCourse.isPending}
                    >
                      Approve
                    </Button>
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