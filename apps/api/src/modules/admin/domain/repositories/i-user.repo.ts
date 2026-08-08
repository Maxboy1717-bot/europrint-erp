/**
 * @module i-user.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { UserAggregate } from '../aggregates/user.aggregate';

export interface UserFilters {
  role?: string;
  departmentId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface IUserRepo {
  findById(id: number): Promise<UserAggregate | null>;
  findByUsername(username: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
  findAll(filters: UserFilters): Promise<PaginatedResult<UserAggregate>>;
  create(user: UserAggregate): Promise<UserAggregate>;
  update(user: UserAggregate): Promise<UserAggregate>;
  softDelete(id: number): Promise<boolean>;
  restore(id: number): Promise<void>;
}

export const USER_REPO = Symbol('IUserRepo');
