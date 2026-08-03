import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole } from '@/types/auth.types';

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  // Actions
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({
          token,
          user,
          role: user.role,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          role: null,
          isAuthenticated: false,
        }),

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },
    }),
    {
      name: 'zaxi-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the token and user — role is derived
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
