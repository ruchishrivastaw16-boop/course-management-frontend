import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, PlusCircle, FileText, UserCheck, ArrowLeft, Save,
  Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/assignments', label: 'Assignments', icon: Award },
  { to: '/instructor/submissions', label: 'Submissions', icon: FileText },   // ← NAYA
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];

interface CourseData {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  price: number;
  is_free: boolean;
  duration_hours: number;
  thumbnail: string;
  status: string;
}

export default function EditCourse() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const courseId = params.id ? Number(params.id) : NaN;

  // ✅ Local state — direct API data
  const [course, setCourse] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // ✅ Direct API call — no cache, always fresh
  useEffect(() => {
    const fetchCourse = async () => {
      console.log('🔍 [EditCourse] Fetching course ID:', courseId);

      if (!courseId || isNaN(courseId)) {
        setError('Invalid course ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch all my courses
        const { data: courses } = await api.get('/instructor/courses/my-courses');
        console.log('🔍 [EditCourse] API returned:', courses);
        console.log('🔍 [EditCourse] Course count:', courses?.length);
        console.log('🔍 [EditCourse] Available IDs:', courses?.map((c: any) => c.id));

        // Find the matching course
        const found = courses?.find((c: any) => Number(c.id) === Number(courseId));
        console.log('🔍 [EditCourse] Found course:', found);

        if (!found) {
          setError(
            `Course with ID ${courseId} not found. Available: ${
              courses?.map((c: any) => c.id).join(', ') || 'none'
            }`
          );
          setIsLoading(false);
          return;
        }

        setCourse(found);
        reset({
          title: found.title || '',
          slug: found.slug || '',
          description: found.description || '',
          category: found.category || '',
          level: found.level || 'beginner',
          price: found.price || 0,
          duration_hours: found.duration_hours || 0,
          thumbnail: found.thumbnail || '',
        });
      } catch (err: any) {
        console.error('🔍 [EditCourse] Fetch error:', err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            'Failed to load course'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, reset]);

  // ─── Update mutation ───
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put(`/instructor/courses/${courseId}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Course updated successfully!');
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      navigate('/instructor/courses');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update course');
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      title: data.title,
      description: data.description,
      category: data.category,
      level: data.level,
      price: parseFloat(data.price) || 0,
      is_free: parseFloat(data.price) === 0,
      duration_hours: parseInt(data.duration_hours) || 0,
      thumbnail: data.thumbnail,
    });
  };

  // ─── Loading ───
  if (isLoading) {
    return (
      <DashboardLayout links={links} title="Edit Course">
        <Spinner />
      </DashboardLayout>
    );
  }

  // ─── Error ───
  if (error || !course) {
    return (
      <DashboardLayout links={links} title="Edit Course">
        <div className="bg-white rounded-xl p-12 text-center max-w-lg mx-auto">
          <p className="text-lg font-semibold text-red-600 mb-2">
            Course not found
          </p>
          <div className="text-sm text-gray-500 space-y-1 mb-4">
            <p>Looking for ID: <strong>{courseId}</strong></p>
            {error && <p className="text-red-500">{error}</p>}
          </div>
          <Button onClick={() => navigate('/instructor/courses')}>
            <ArrowLeft size={16} /> Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Form ───
  return (
    <DashboardLayout links={links} title="Edit Course">
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b">
          <button
            onClick={() => navigate('/instructor/courses')}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">Edit Course</h2>
            <p className="text-xs text-gray-500">
              ID: {course.id} · Status:{' '}
              <span className="font-medium capitalize">{course.status}</span>
            </p>
          </div>
          {course.thumbnail && (
            <img
              src={course.thumbnail}
              className="w-16 h-16 rounded-lg object-cover"
              alt=""
            />
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Course Title"
            placeholder="e.g. React Masterclass 2025"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message as string}
          />

          <Input
            label="Slug (read-only)"
            {...register('slug')}
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />

          <Input
            label="Category"
            placeholder="e.g. Web Development"
            {...register('category', { required: 'Category is required' })}
            error={errors.category?.message as string}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe what students will learn..."
              {...register('description', { required: 'Description is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.description.message as string}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                {...register('level')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              placeholder="49.99"
              {...register('price')}
            />

            <Input
              label="Duration (hrs)"
              type="number"
              placeholder="20"
              {...register('duration_hours')}
            />
          </div>

          <Input
            label="Thumbnail URL"
            placeholder="https://..."
            {...register('thumbnail')}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-5 border-t">
            <Button type="submit" loading={updateMutation.isPending}>
              <Save size={16} /> Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/instructor/courses')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}