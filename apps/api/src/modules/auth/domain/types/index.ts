/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role?: string;
  /**
   * Phase 2 / Task 2.1 — multi-tenancy claim. Optional today so legacy
   * tokens (issued before the claim was added) continue to authenticate;
   * `TenantContextInterceptor` falls back to DEFAULT_TENANT_ID when absent.
   */
  tenantId?: number;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  sub?: number;
  employeeId?: number;
  /** Phase 2 / Task 2.1 — tenant scope carried alongside the user. */
  tenantId?: number;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PASSWORD_INVALID = 'PASSWORD_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
