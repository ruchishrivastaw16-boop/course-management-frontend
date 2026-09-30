import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  UserCheck,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];

export default function ManageCourses() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/courses/my-courses');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await api.delete(`/instructor/courses/${courseId}`);
    },
    onSuccess: () => {
      toast.success('Course deleted successfully!');
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete course');
    },
  });

  const filteredCourses = courses?.filter((c: any) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDelete = (courseId: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(courseId);
    }
  };

  return (
    <DashboardLayout links={links} title="Manage Courses">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <Link to="/instructor/create">
          <Button>
            <PlusCircle size={16} /> Create Course
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Empty State */}
      {!isLoading && filteredCourses.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {search ? 'No courses match your search' : 'No courses yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'Try a different search term' : 'Create your first course to get started'}
          </p>
          {!search && (
            <Link to="/instructor/create">
              <Button>Create Course</Button>
            </Link>
          )}
        </div>
      )}

      {/* Course List */}
      {!isLoading && filteredCourses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Level</th>
                <th className="text-left px-5 py-3">Price</th>
                <th className="text-left px-5 py-3">Students</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {c.thumbnail ? (
                        <img
                          src={c.thumbnail}
                          className="w-12 h-12 rounded-lg object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <FileText className="text-gray-400" size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{c.title}</div>
                        <div className="text-xs text-gray-500">{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.category}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{c.level}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {c.is_free ? 'Free' : `$${c.price}`}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.students_count || 0}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.status === 'published' ? 'bg-green-100 text-green-700' :
                      c.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/instructor/courses/${c.id}/edit`}>
                        <button
                          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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