import apiClient from '@/api/axios';
import type {
  RequestCodeRequest,
  RequestCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequestCodeRequest,
  LoginVerifyRequest,
  LoginResponse,
  CurrentUserResponse,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const AuthService = {
  // ─── Registration OTP Flow (new customers only) ────────────────────────────

  /** Step 1: Send registration OTP to phone */
  requestCode: (data: RequestCodeRequest) =>
    apiClient.post<ApiResponse<RequestCodeResponse>>('/auth/request-code', data),

  /** Step 2: Verify registration OTP — returns { isNewUser, verificationToken } */
  verifyCode: (data: VerifyCodeRequest) =>
    apiClient.post<ApiResponse<VerifyCodeResponse>>('/auth/verify-code', data),

  /** Step 3: Create customer account with name + verificationToken */
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data),

  // ─── Login OTP Flow (all users: customers + driver) ────────────────────────

  /** Step 1: Request a login OTP for any registered phone */
  loginRequestCode: (data: LoginRequestCodeRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/login/request-code', data),

  /** Step 2: Verify login OTP — returns JWT + user (role determined by backend) */
  loginVerify: (data: LoginVerifyRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login/verify', data),

  // ─── Session ───────────────────────────────────────────────────────────────

  /** Get current authenticated user */
  getCurrentUser: () =>
    apiClient.get<ApiResponse<CurrentUserResponse>>('/auth/me'),

  /** Logout — invalidates server session */
  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),
};
