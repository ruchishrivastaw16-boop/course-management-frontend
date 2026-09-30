import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const result = await authService.register({
        full_name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      localStorage.setItem('cms_token', result.access_token);
      localStorage.setItem('cms_user', JSON.stringify(result.user));

      toast.success('Account created!');
      const path = result.user.role === 'instructor'
        ? '/instructor/dashboard'
        : '/student/dashboard';
      window.location.href = path;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-500">Start learning today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message as string}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message as string}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            })}
            error={errors.password?.message as string}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}