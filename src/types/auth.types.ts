// ─── User & Auth Types ───────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'DRIVER';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  dateOfBirth?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

// ─── Request DTOs (Password Auth) ────────────────────────────────────────────

export interface RegisterRequest {
  phone: string;
  name: string;
  dateOfBirth: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface ForgotPasswordVerifyRequest {
  phone: string;
  dateOfBirth: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface ForgotPasswordVerifyResponse {
  resetToken: string;
}

export interface CurrentUserResponse {
  user: User;
}

