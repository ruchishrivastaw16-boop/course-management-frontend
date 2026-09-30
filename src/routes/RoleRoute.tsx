import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/index';

export default function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allowed.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}