import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * CustomerRoute — Only accessible when authenticated as a CUSTOMER.
 * Redirects unauthenticated users to /login.
 * Redirects drivers to their dashboard.
 */
export function CustomerRoute() {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" state={{ from: location.pathname }} replace />;
  }

  if (role === 'DRIVER') {
    return <Navigate to="/driver/dashboard" replace />;
  }

  return <Outlet />;
}
