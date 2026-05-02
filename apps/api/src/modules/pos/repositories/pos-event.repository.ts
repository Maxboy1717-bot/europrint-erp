import { Injectable } from '@nestjs/common';
import { db, eq, and, sql, inArray, posMovements } from '@workspace/db';
import { users } from '@europrint/schemas';

export type EventUserRow = { id: number; telegramId: bigint | null };
export type EventMovRow  = { createdBy: number | null; telegramId: bigint | null; movementNumber: string; movementType: string | null };

@Injectable()
export class PosEventRepository {
  async findByRoles(roles: string[]): Promise<EventUserRow[]> {
    return db
      .select({ id: users.id, telegramId: sql<bigint | null>`telegram_id` })
      .from(users)
      .where(and(inArray(users.role, roles), eq(users.isActive, true))) as Promise<EventUserRow[]>;
  }

  async findOneByRole(role: string): Promise<EventUserRow | null> {
    const [row] = await db
      .select({ id: users.id, telegramId: sql<bigint | null>`telegram_id` })
      .from(users)
      .where(and(eq(users.role, role), eq(users.isActive, true)))
      .limit(1);
    return (row as EventUserRow) ?? null;
  }

  async findMovementCreator(movementId: number): Promise<EventMovRow | null> {
    const [row] = await db
      .select({
        createdBy:      sql<number | null>`created_by`,
        telegramId:     sql<bigint | null>`u.telegram_id`,
        movementNumber: posMovements.movementNumber,
        movementType:   posMovements.movementType,
      })
      .from(posMovements)
      .leftJoin(users, sql`${users.id} = created_by`)
      .where(eq(posMovements.id, movementId))
      .limit(1);
    return (row as EventMovRow) ?? null;
  }

  async findUserTelegramId(userId: number): Promise<bigint | null> {
    const [row] = await db
      .select({ telegramId: sql<bigint | null>`telegram_id` })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return (row?.telegramId as bigint | null) ?? null;
  }
}
