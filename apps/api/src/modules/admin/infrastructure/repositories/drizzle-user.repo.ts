/**
 * @module drizzle-user.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DEFAULT_PAGE_SIZE } from '@common/constants/app.constants';
import { Database } from '@/infrastructure/database/database';
import { IUserRepo, UserFilters, PaginatedResult } from '../../domain/repositories/i-user.repo';
import { UserAggregate, UserAggregateData, UserRole } from '../../domain/aggregates/user.aggregate';
import { users } from '@europrint/schemas';
import { eq, and, sql } from 'drizzle-orm';

type UserRow = typeof users.$inferSelect;

function rowToDomain(row: UserRow): UserAggregate {
  const data: UserAggregateData = {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as UserRole,
    departmentId: row.departmentId != null ? Number(row.departmentId) : null,
    positionId: row.positionId != null ? Number(row.positionId) : null,
    isActive: row.isActive,
    lastLogin: row.lastLoginAt ?? null,
    createdAt: row.createdAt ?? _time.now(),
    updatedAt: row.updatedAt ?? _time.now(),
  };
  return new UserAggregate(data);
}

@Injectable()
export class DrizzleUserRepo implements IUserRepo {
  private readonly logger = new Logger(DrizzleUserRepo.name);
  constructor(
    private readonly db: Database,
    private readonly i18n: I18nService,
  ) {}

  async findById(id: number): Promise<UserAggregate | null> {
    try {
      const rows = await this.db.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0] ? rowToDomain(rows[0]) : null;
    } catch (error: unknown) {
      this.logger.error('Error finding user by id');
      return null;
    }
  }

  async findByUsername(username: string): Promise<UserAggregate | null> {
    try {
      const rows = await this.db.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      return rows[0] ? rowToDomain(rows[0]) : null;
    } catch (error: unknown) {
      this.logger.error('Error finding user by username');
      return null;
    }
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    try {
      const rows = await this.db.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return rows[0] ? rowToDomain(rows[0]) : null;
    } catch (error: unknown) {
      this.logger.error('Error finding user by email');
      return null;
    }
  }

  async findAll(filters: UserFilters): Promise<PaginatedResult<UserAggregate>> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (filters.role) conditions.push(eq(users.role, filters.role));
      if (filters.isActive !== undefined) {
        conditions.push(eq(users.isActive, filters.isActive));
      } else {
        conditions.push(eq(users.isActive, true)); // default: show only active users
      }
      if (filters.departmentId) {
        conditions.push(eq(users.departmentId, Number(filters.departmentId)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [results, countRows] = await Promise.all([
        this.db.db.select().from(users).where(whereClause).limit(limit).offset(offset),
        this.db.db.select({ count: sql<number>`COUNT(*)` }).from(users).where(whereClause),
      ]);

      const total = Number(countRows[0]?.count ?? 0);
      const pages = Math.ceil(total / limit);

      return {
        data: (Array.isArray(results) ? results : []).map(rowToDomain),
        total,
        page,
        limit,
        pages,
      };
    } catch (error: unknown) {
      this.logger.error('Error finding all users');
      return { data: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, pages: 0 };
    }
  }

  async create(user: UserAggregate): Promise<UserAggregate> {
    try {
      const data = user.toPersistence();
      const result = await this.db.db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          departmentId: data.departmentId != null ? Number(data.departmentId) : null,
          positionId: data.positionId != null ? Number(data.positionId) : null,
          isActive: data.isActive,
          lastLoginAt: data.lastLogin,
        } as typeof users.$inferInsert)
        .returning();

      if (result.length === 0) throw new InternalServerErrorException(await this.i18n.t('errors.createFailed'));
      return rowToDomain(result[0]);
    } catch (error: unknown) {
      this.logger.error('Error creating user');
      throw error;
    }
  }

  async update(user: UserAggregate): Promise<UserAggregate> {
    try {
      const data = user.toPersistence();
      const result = await this.db.db
        .update(users)
        .set({
          role: data.role,
          departmentId: data.departmentId != null ? Number(data.departmentId) : null,
          positionId: data.positionId != null ? Number(data.positionId) : null,
          isActive: data.isActive,
          lastLoginAt: data.lastLogin,
          passwordHash: data.passwordHash,
          updatedAt: _time.now(),
        })
        .where(eq(users.id, data.id))
        .returning();

      if (result.length === 0) throw new InternalServerErrorException(await this.i18n.t('errors.userNotFound'));
      return rowToDomain(result[0]);
    } catch (error: unknown) {
      this.logger.error('Error updating user');
      throw error;
    }
  }

  async softDelete(id: number): Promise<boolean> {
    // audit 2026-08-06 T3: was fire-and-forget (swallowed errors, ignored affected
    // rows) — endpoint returned 200 even for nonexistent ids. Now returns whether
    // a row was actually deactivated; DB errors propagate to the controller.
    const result = await this.db.db
      .update(users)
      .set({ isActive: false, updatedAt: _time.now() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return result.length > 0;
  }

  async restore(id: number): Promise<void> {
    try {
      await this.db.db
        .update(users)
        .set({ isActive: true, updatedAt: _time.now() })
        .where(eq(users.id, id));
    } catch (error: unknown) {
      this.logger.error('Error restoring user');
    }
  }
}
