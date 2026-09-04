import { Navigate, Outlet } from 'react-router-dom';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import { SALES_ROUTES } from '@/constants/salesRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function SalesProtectedRoute() {
  const { member, loading } = useSalesAuth();

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!member) return <Navigate to={SALES_ROUTES.login} replace />;

  return <Outlet />;
}
