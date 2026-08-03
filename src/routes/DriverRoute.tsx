import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * DriverRoute — Only accessible when authenticated as a DRIVER.
 * Redirects unauthenticated users to /driver/login.
 * Redirects customers to their home page.
 */
export function DriverRoute() {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/driver/login" state={{ from: location.pathname }} replace />;
  }

  if (role === 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
