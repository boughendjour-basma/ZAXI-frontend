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
  CurrentUserResponse,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const AuthService = {
  // ─── Sign-Up Flow ──────────────────────────────────────────────────────────

  /** Step 1: Send OTP to phone number */
  requestCode: (data: RequestCodeRequest) =>
    apiClient.post<ApiResponse<RequestCodeResponse>>('/auth/request-code', data),

  /** Step 2: Verify OTP — returns { isNewUser, verificationToken } */
  verifyCode: (data: VerifyCodeRequest) =>
    apiClient.post<ApiResponse<VerifyCodeResponse>>('/auth/verify-code', data),

  /** Step 3: Register customer with name + verificationToken (Passwordless) */
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data),

  // ─── Login / Session ───────────────────────────────────────────────────────

  /** Customer login: phone only. Driver login: phone + password */
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  /** Get current authenticated user */
  getCurrentUser: () =>
    apiClient.get<ApiResponse<CurrentUserResponse>>('/auth/me'),

  /** Logout — invalidates server session */
  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),
};
