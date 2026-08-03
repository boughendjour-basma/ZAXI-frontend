import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';
import { queryClient } from '@/lib/queryClient';
import { disconnectSocket } from '@/lib/socket';
import type { LoginRequest } from '@/types/auth.types';

export function useAuth() {
  const { user, token, role, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const isCustomer = role === 'CUSTOMER';
  const isDriver = role === 'DRIVER';

  // ─── Login ─────────────────────────────────────────────────────────────────

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => AuthService.login(data),
    onSuccess: (response) => {
      const { token: newToken, user: newUser } = response.data.data!;
      setAuth(newToken, newUser);
      toast.success(`Welcome back, ${newUser.name ?? newUser.phone}!`);
      if (newUser.role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/');
      }
    },
    onError: () => {
      toast.error('Invalid phone number or password.');
    },
  });

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
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
