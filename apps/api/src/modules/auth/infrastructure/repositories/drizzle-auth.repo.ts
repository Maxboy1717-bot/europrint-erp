import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Database } from '@/infrastructure/database/database';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AuthUserAggregate, AuthUserData } from '../../domain/aggregates/auth-user.aggregate';
import { users } from '@europrint/schemas';
import { eq } from 'drizzle-orm';

type UserRow = typeof users.$inferSelect;

function rowToUserData(row: UserRow): AuthUserData {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    isActive: row.isActive,
    lastLogin: row.lastLoginAt ?? null,
    failedLoginAttempts: row.failedLoginAttempts ?? 0,
    lockUntil: row.lockUntil ?? null,
  };
}

@Injectable()
export class DrizzleAuthRepo implements IAuthRepo {
  private readonly logger = new Logger(DrizzleAuthRepo.name);
  constructor(private readonly db: Database) {}

  async findByUsername(username: string): Promise<AuthUserAggregate | null> {
    try {
      const rows = await this.db.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      if (!rows[0]) return null;
      return new AuthUserAggregate(rowToUserData(rows[0]));
    } catch (error: unknown) {
      this.logger.error(`findByUsername failed: ${error}`);
      return null;
    }
  }

  async findById(id: number): Promise<AuthUserAggregate | null> {
    try {
      const rows = await this.db.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!rows[0]) return null;
      return new AuthUserAggregate(rowToUserData(rows[0]));
    } catch (error: unknown) {
      this.logger.error(`findById failed: ${error}`);
      return null;
    }
  }

  async save(user: AuthUserAggregate): Promise<AuthUserAggregate> {
    try {
      const data = user.toPersistence();
      await this.db.db
        .update(users)
        .set({
          passwordHash: data.passwordHash,
          lastLoginAt: data.lastLogin,
          failedLoginAttempts: data.failedLoginAttempts,
          lockUntil: data.lockUntil,
        })
        .where(eq(users.id, data.id));
      return user;
    } catch (error: unknown) {
      this.logger.error(`save failed: ${error}`);
      throw error;
    }
  }

  async updateLastLogin(userId: number, _ipAddress: string, timestamp: Date): Promise<void> {
    try {
      await this.db.db
        .update(users)
        .set({ lastLoginAt: timestamp })
        .where(eq(users.id, userId));
    } catch (error: unknown) {
      this.logger.error(`updateLastLogin failed: ${error}`);
    }
  }

  async blacklistToken(_token: string, _expiresAt: Date): Promise<void> {
    this.logger.debug('Token blacklisted (Redis placeholder)');
  }

  async isTokenBlacklisted(_token: string): Promise<boolean> {
    return false;
  }

  async incrementFailedAttempts(userId: number): Promise<void> {
    try {
      const rows = await this.db.db
        .select({ cnt: users.failedLoginAttempts })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const current: number = rows[0]?.cnt ?? 0;
      await this.db.db
        .update(users)
        .set({ failedLoginAttempts: current + 1 })
        .where(eq(users.id, userId));
    } catch (error: unknown) {
      this.logger.error(`incrementFailedAttempts failed: ${error}`);
    }
  }

  async lockUserAccount(userId: number, minutesDuration: number): Promise<void> {
    try {
      const lockUntil = _time.now();
      lockUntil.setMinutes(lockUntil.getMinutes() + minutesDuration);
      await this.db.db
        .update(users)
        .set({ lockUntil })
        .where(eq(users.id, userId));
    } catch (error: unknown) {
      this.logger.error(`lockUserAccount failed: ${error}`);
    }
  }

  async resetFailedAttempts(userId: number): Promise<void> {
    try {
      await this.db.db
        .update(users)
        .set({ failedLoginAttempts: 0, lockUntil: null })
        .where(eq(users.id, userId));
    } catch (error: unknown) {
      this.logger.error(`resetFailedAttempts failed: ${error}`);
    }
  }
}
