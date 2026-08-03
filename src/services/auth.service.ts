import apiClient from '@/api/axios';
import type {
  RequestCodeRequest,
  RequestCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  ForgotPasswordRequestCodeRequest,
  ResetPasswordRequest,
  CurrentUserResponse,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const AuthService = {
  // ─── Sign-Up Flow ──────────────────────────────────────────────────────────

  /** Step 1: Send OTP to phone number */
  requestCode: (data: RequestCodeRequest) =>
    apiClient.post<ApiResponse<RequestCodeResponse>>('/auth/request-code', data),

  /** Step 2: Verify OTP — returns otpToken for registration */
  verifyCode: (data: VerifyCodeRequest) =>
    apiClient.post<ApiResponse<VerifyCodeResponse>>('/auth/verify-code', data),

  /** Step 3: Register with name + password + otpToken */
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data),

  // ─── Login / Session ───────────────────────────────────────────────────────

  /** Login with phone + password (customers and driver) */
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  /** Get current authenticated user */
  getCurrentUser: () =>
    apiClient.get<ApiResponse<CurrentUserResponse>>('/auth/me'),

  /** Logout — invalidates server session */
  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),

  /** Change password (authenticated) */
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.patch<ApiResponse<null>>('/auth/change-password', data),

  // ─── Password Recovery ─────────────────────────────────────────────────────

  /** Step 1: Send OTP for password reset */
  forgotPasswordRequestCode: (data: ForgotPasswordRequestCodeRequest) =>
    apiClient.post<ApiResponse<RequestCodeResponse>>('/auth/forgot-password/request-code', data),

  /** Step 2: Reset password with OTP + new password */
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password/reset', data),
};
