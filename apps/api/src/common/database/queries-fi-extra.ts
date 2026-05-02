import { db } from '@shared/db';
import { cost_centers, profit_centers } from '@shared/db';
import { eq, sql } from 'drizzle-orm';

export async function execCostCenterSoftDelete(id: unknown): Promise<void> {
  await db.update(cost_centers)
    .set({ deleted_at: sql`NOW()` })
    .where(eq(cost_centers.id, id as number));
}

export async function execProfitCenterSoftDelete(id: unknown): Promise<void> {
  await db.update(profit_centers)
    .set({ deleted_at: sql`NOW()` })
    .where(eq(profit_centers.id, id as number));
}
