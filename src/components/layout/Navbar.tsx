import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'instructor' ? '/instructor/dashboard'
    : '/student/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
          <GraduationCap size={28} />
          CourseHub
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-indigo-600">Home</Link>
          <Link to="/courses" className="text-gray-700 hover:text-indigo-600">Courses</Link>
          {isAuthenticated && (
            <Link to={dashboardPath} className="text-gray-700 hover:text-indigo-600">
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
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
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/register"><Button size="sm">Sign Up</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}