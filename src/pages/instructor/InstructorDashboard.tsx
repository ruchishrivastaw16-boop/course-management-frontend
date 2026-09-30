import { BookOpen, Users, DollarSign, Star, LayoutDashboard, PlusCircle, FileText, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/charts/StatsCard';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useMyCourses } from '../../hooks/useCourses';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useMyCourses();

  const totalStudents = courses?.reduce((s, c) => s + (c.students_count || 0), 0) || 0;

  return (
    <DashboardLayout links={links} title="Instructor Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatsCard icon={BookOpen} label="Total Courses" value={courses?.length || 0} color="indigo" />
        <StatsCard icon={Users} label="Total Students" value={totalStudents} color="green" />
        <StatsCard icon={DollarSign} label="Total Revenue" value="$12,450" color="yellow" />
        <StatsCard icon={Star} label="Avg Rating" value="4.7" color="purple" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Courses</h2>
        <Link to="/instructor/create">
          <Button><PlusCircle size={16} /> New Course</Button>
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !courses || courses.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          No courses yet. Create your first one!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Students</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={c.thumbnail} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <span className="font-medium">{c.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.category}</td>
                  <td className="px-5 py-3 text-gray-600">{c.students_count}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.status}
                    </span>
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