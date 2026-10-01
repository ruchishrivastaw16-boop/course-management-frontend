import { useState } from 'react';
import { LayoutDashboard, PlusCircle, FileText, UserCheck, Mail, Search, Award } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useMyCourses } from '../../hooks/useCourses';
import { useAllMyStudents } from '../../hooks/useEnrollments';
import type { Enrollment } from '../../types/index';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/assignments', label: 'Assignments', icon: Award },
  { to: '/instructor/submissions', label: 'Submissions', icon: FileText },   // ← NAYA
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];
export default function Students() {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<number | 'all'>('all');

  const { data: courses } = useMyCourses();
  const { data: students, isLoading } = useAllMyStudents();

  const filtered = (students || []).filter((s: Enrollment) => {
    if (search && !s.student_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (courseFilter !== 'all' && s.course_id !== courseFilter) return false;
    return true;
  });

  const stats = {
    total: students?.length || 0,
    active: students?.filter((s) => s.status === 'active').length || 0,
    completed: students?.filter((s) => s.status === 'completed').length || 0,
    avgProgress: students?.length
      ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
      : 0,
  };

  return (
    <DashboardLayout links={links} title="My Students">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Courses</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Active', value: stats.active, color: 'bg-green-50 text-green-700' },
          { label: 'Completed', value: stats.completed, color: 'bg-blue-50 text-blue-700' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'bg-yellow-50 text-yellow-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-75">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <UserCheck className="mx-auto text-gray-300 mb-3" size={48} />
          <p>No students enrolled yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Progress</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                        {s.student_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{s.student_name}</p>
                        <p className="text-xs text-gray-500">{s.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{s.course_title}</td>
                  <td className="px-5 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-9">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.status === 'completed' ? 'bg-green-100 text-green-700'
                      : s.status === 'active' ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Button size="sm" variant="outline"><Mail size={14} /> Message</Button>
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