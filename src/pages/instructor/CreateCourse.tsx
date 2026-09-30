import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, UserCheck } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useCreateCourse } from '../../hooks/useCourses';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];

export default function CreateCourse() {
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const navigate = useNavigate();
  const createCourse = useCreateCourse();

  // Auto-generate slug from title
  const title = watch('title');
  const generateSlug = (text: string) =>
    text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '';

  const onSubmit = (data: any) => {
    createCourse.mutate(
      {
        ...data,
        slug: data.slug || generateSlug(data.title),
        price: parseFloat(data.price) || 0,
        duration_hours: parseInt(data.duration_hours) || 0,
        is_free: parseFloat(data.price) === 0,
      },
      {
        onSuccess: () => {
          reset();
          navigate('/instructor/dashboard');
        },
      }
    );
  };

  return (
    <DashboardLayout links={links} title="Create New Course">
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Course Title"
            placeholder="e.g. React Masterclass"
            {...register('title', { required: true })}
            onChange={(e) => {
              setValue('title', e.target.value);
              setValue('slug', generateSlug(e.target.value));
            }}
          />
          <Input label="Slug (auto)" {...register('slug')} readOnly className="bg-gray-50" />
          <Input label="Category" placeholder="Web Development" {...register('category', { required: true })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              {...register('description', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select {...register('level')} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <Input label="Price ($)" type="number" step="0.01" placeholder="49.99" {...register('price')} />
            <Input label="Duration (hrs)" type="number" placeholder="20" {...register('duration_hours')} />
          </div>

          <Input label="Thumbnail URL" placeholder="https://..." {...register('thumbnail')} />

          <div className="flex gap-3">
            <Button type="submit" loading={createCourse.isPending}>Create Course</Button>
            <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}