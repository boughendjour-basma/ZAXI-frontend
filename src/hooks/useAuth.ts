import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';
import { queryClient } from '@/lib/queryClient';
import { disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const { user, token, role, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const isCustomer = role === 'CUSTOMER';
  const isDriver = role === 'DRIVER';

  // ─── Post-login redirect ────────────────────────────────────────────────────
  // Called by LoginPage after loginVerify succeeds.

  const redirectAfterLogin = useCallback(
    (userRole: string, userName?: string | null, userPhone?: string) => {
      const displayName = userName ?? userPhone ?? 'back';
      toast.success(`Welcome back, ${displayName}!`);
      if (userRole === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/');
      }
    },
    [navigate]
  );

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch {
      // Ignore — clear locally regardless
    }
    disconnectSocket();
    clearAuth();
    queryClient.clear();
    navigate('/login');
    toast.success('You have been logged out.');
  }, [clearAuth, navigate]);

  return {
    user,
    token,
    role,
    isAuthenticated,
    isCustomer,
    isDriver,
    setAuth,
    redirectAfterLogin,
    logout,
  };
}
