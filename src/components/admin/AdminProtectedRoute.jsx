import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminProtectedRoute() {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!isAdmin) return <Navigate to={ADMIN_ROUTES.login} replace />;

  return <Outlet />;
}
