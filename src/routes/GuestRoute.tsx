import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * GuestRoute — Only accessible when NOT authenticated.
 * Redirects authenticated users to their respective dashboards.
 */
export function GuestRoute() {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from;
    if (role === 'DRIVER') {
      return <Navigate to={from ?? '/driver/dashboard'} replace />;
    }
    return <Navigate to={from ?? '/'} replace />;
  }

  return <Outlet />;
}
