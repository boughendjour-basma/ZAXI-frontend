import apiClient from '@/api/axios';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
  ResetPasswordRequest,
  CurrentUserResponse,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const AuthService = {
  /** Create customer account with phone, name, dateOfBirth & password */
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data),

  /** Login with phone & password */
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  /** Verify identity with phone, name & dateOfBirth for password recovery */
  forgotPasswordVerify: (data: ForgotPasswordVerifyRequest) =>
    apiClient.post<ApiResponse<ForgotPasswordVerifyResponse>>('/auth/forgot-password/verify', data),

  /** Reset password using short-lived resetToken */
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password/reset', data),

  /** Get current authenticated user */
  getCurrentUser: () =>
    apiClient.get<ApiResponse<CurrentUserResponse>>('/auth/me'),

  /** Logout — invalidates server session */
  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),
};

