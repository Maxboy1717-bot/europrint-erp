/**
 * test/_setup/auth-fixtures.ts
 *
 * JWT token mint helpers for integration tests. Uses the same JwtService that
 * the application bootstraps so signed tokens validate against the running
 * Nest app under @nestjs/testing.
 */

import { JwtService } from '@nestjs/jwt';

export type TestRole =
  | 'admin'
  | 'super_admin'
  | 'hr'
  | 'cfo'
  | 'sales_manager'
  | 'operator'
  | 'director';

export interface TestUser {
  id: number;
  username: string;
  role: TestRole;
  positionId?: number;
}

export interface AuthFixture {
  user: TestUser;
  token: string;
  authHeader: { Authorization: string };
}

const ACCESS_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-prod';
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-do-not-use-in-prod';

let _seq = 1000;
function nextId(): number {
  _seq += 1;
  return _seq;
}

export function makeUser(role: TestRole, overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: overrides.id ?? nextId(),
    username: overrides.username ?? `${role}_${Math.floor(Math.random() * 1e6)}`,
    role,
    positionId: overrides.positionId,
  };
}

export function signAccess(user: TestUser, secret = ACCESS_SECRET): string {
  const jwt = new JwtService({ secret });
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, positionId: user.positionId },
    { expiresIn: '1h' },
  );
}

export function signRefresh(user: TestUser, secret = REFRESH_SECRET): string {
  const jwt = new JwtService({ secret });
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    { expiresIn: '7d' },
  );
}

export function loginAs(role: TestRole, overrides: Partial<TestUser> = {}): AuthFixture {
  const user = makeUser(role, overrides);
  const token = signAccess(user);
  return { user, token, authHeader: { Authorization: `Bearer ${token}` } };
}

export function expiredTokenFor(user: TestUser): string {
  const jwt = new JwtService({ secret: ACCESS_SECRET });
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, { expiresIn: '-1h' });
}

export function malformedToken(): string {
  return 'Bearer not-a-real-jwt.with.bad-segments';
}
