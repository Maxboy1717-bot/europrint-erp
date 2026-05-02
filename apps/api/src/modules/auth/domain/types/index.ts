export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role?: string;
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
}

export interface AuthResult {
  accessToken: string;
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
