/**
 * @module @workspace/types/user
 * @description Canonical User + Auth types.
 */

export interface User {
  id: number | string;
  username: string;
  email?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  department_id?: number | string | null;
  is_active?: boolean;
  avatar_url?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface JwtPayload {
  sub: number;
  username: string;
  email?: string;
  role: string;
  departmentId?: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: number;
  sub?: number;
  username: string;
  email?: string;
  role: string;
  department_id?: number;
  permissions?: string[];
}
