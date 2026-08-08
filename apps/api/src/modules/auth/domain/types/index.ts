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
  /**
   * EP-ORG-023 (T12-07) — KARTA-claim'lar. login.service.buildAuthResult ularni
   * imzolaydi (resolveCardGate'dan): birlamchi karta (cardId), uning RBAC tier'i
   * (rbacTier — razryad/override'dan, rbac-tier.policy.ts) va position (positionId).
   * Optional: kartasiz user yoki eski token uchun undefined → guard'lar eski
   * role/position yo'liga toza fallback qiladi (additiv, regress yo'q — Q-39).
   */
  cardId?: number | null;
  rbacTier?: string | null;
  positionId?: number | null;
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
  /**
   * EP-ORG-023 (T12-07) — birlamchi kartadan kelgan claim'lar (JWT'dan
   * jwt.strategy.validate orqali ko'chiriladi). Guard'lar (RolesGuard A5 /
   * PermissionGuard A6) shulardan ruxsat o'qiydi. Kartasiz user → null/undefined.
   */
  cardId?: number | null;
  rbacTier?: string | null;
  positionId?: number | null;
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
  NO_ACTIVE_CARD = 'NO_ACTIVE_CARD',   // EP-ORG-003: lavozim-kartasiga biriktirilmagan
  UNAUTHORIZED = 'UNAUTHORIZED',
}
