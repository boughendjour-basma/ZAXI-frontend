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

// Registration OTP flow (new customers only)
export interface RequestCodeRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface RegisterRequest {
  verificationToken: string;
  name: string;
}

// Login OTP flow (all users: customers + driver)
export interface LoginRequestCodeRequest {
  phone: string;
}

export interface LoginVerifyRequest {
  phone: string;
  code: string;
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
  isNewUser: boolean;
  verificationToken?: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}
