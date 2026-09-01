import { Navigate, Outlet } from 'react-router-dom';
import { useMentorAuth } from '@/contexts/MentorAuthContext';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MentorProtectedRoute() {
  const { mentor, loading } = useMentorAuth();

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!mentor) return <Navigate to={MENTOR_ROUTES.login} replace />;

  return <Outlet />;
}
