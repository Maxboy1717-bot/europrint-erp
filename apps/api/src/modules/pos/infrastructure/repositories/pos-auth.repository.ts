/**
 * POS — Auth Repository
 * Data-access layer for POS authentication.
 * Returns Result<T, AppError> — no exceptions cross the repository boundary.
 */
import { Injectable } from '@nestjs/common';
import { db, eq } from '@workspace/db';
import { users } from '@europrint/schemas';
import { Ok, Err, Result, AppErr } from '@common/result';

export interface PosUserRow {
  id:           number;
  username:     string;
  passwordHash: string;
  role:         string;
  isActive:     boolean;
}

@Injectable()
export class PosAuthRepository {
  async findByUsername(username: string): Promise<Result<PosUserRow>> {
    try {
      const [user] = await db
        .select({
          id:           users.id,
          username:     users.username,
          passwordHash: users.passwordHash,
          role:         users.role,
          isActive:     users.isActive,
        })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user || !user.isActive) {
        return Err(AppErr('NOT_FOUND', 'Kirish rad etildi'));
      }
      return Ok(user as PosUserRow);
    } catch (e) {
      return Err(AppErr('INTERNAL', `DB xatolik: ${String(e)}`));
    }
  }
}
