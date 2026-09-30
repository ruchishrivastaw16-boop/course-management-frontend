import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const result = await authService.login(data.email, data.password);
      localStorage.setItem('cms_token', result.access_token);
      localStorage.setItem('cms_user', JSON.stringify(result.user));

      const path =
        result.user.role === 'admin' ? '/admin/dashboard'
        : result.user.role === 'instructor' ? '/instructor/dashboard'
        : '/student/dashboard';

      toast.success(`Welcome back, ${result.user.full_name}!`);
      window.location.href = path;   // Full reload to refresh useAuth
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
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
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-sm text-gray-500">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message as string}
          />

          <Button type="submit" loading={loading} className="w-full">
            Login
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Sign Up
          </Link>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700">Demo Accounts:</p>
          <p>👤 Admin — admin@example.com / string</p>
          <p>👨‍🏫 Instructor — Instructor@example.com / string</p>
          <p>🎓 Student — student@example.com / string</p>
        </div>
      </div>
    </div>
  );
}