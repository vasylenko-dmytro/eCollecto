import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  const isAdmin = user?.roles.includes('admin') ?? false;

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin)          return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}

