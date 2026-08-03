// ─── User & Auth Types ───────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'DRIVER';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface RequestCodeRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface RegisterRequest {
  phone: string;
  name: string;
  password: string;
  otpToken: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequestCodeRequest {
  phone: string;
}

export interface ResetPasswordRequest {
  phone: string;
  code: string;
  newPassword: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RequestCodeResponse {
  message: string;
}

export interface VerifyCodeResponse {
  message: string;
  otpToken: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}
