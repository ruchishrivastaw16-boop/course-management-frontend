import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, LogOut, User as UserIcon,
  Bell, Check, X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import api from '../../services/api';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'instructor'
      ? '/instructor/dashboard'
      : '/student/dashboard';

  // Fetch notifications (only if logged in)
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/');
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-indigo-600"
        >
          <GraduationCap size={28} />
          CourseHub
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-indigo-600">
            Home
          </Link>
          <Link to="/courses" className="text-gray-700 hover:text-indigo-600">
            Courses
          </Link>
          {isAuthenticated && (
            <Link
              to={dashboardPath}
              className="text-gray-700 hover:text-indigo-600"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                  title="Notifications"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-gray-500">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {!notifications || notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm">
                            <Bell
                              className="mx-auto text-gray-300 mb-2"
                              size={32}
                            />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((n: any) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!n.is_read) markReadMutation.mutate(n.id);
                              }}
                              className={`p-4 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition ${
                                !n.is_read ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {!n.is_read && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-800">
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                                    {n.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(n.created_at).toLocaleString()}
                                  </p>
                                </div>
                                {n.is_read && (
                                  <Check
                                    size={14}
                                    className="text-green-500 shrink-0"
                                  />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Info */}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-700">
                <UserIcon size={18} />
                {user?.full_name}
              </div>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}