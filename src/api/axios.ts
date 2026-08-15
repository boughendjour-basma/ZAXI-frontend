import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Request Interceptor: Attach Bearer Token ─────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor: Handle 401 / errors ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const pathname = window.location.pathname;

    const isAuthPage =
      pathname === '/login' ||
      pathname === '/create-account' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/welcome' ||
      pathname === '/splash';

    if (status === 401 && !isAuthPage) {
      useAuthStore.getState().clearAuth();
      window.location.replace('/login');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
