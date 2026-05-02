/**
 * db-cqrs.ts — TZ-63: Read Replica + CQRS Provider.
 *
 * Command (yozish) → MASTER_DATABASE_URL  (DATABASE_URL)
 * Query  (o'qish)  → SLAVE_DATABASE_URL   (ixtiyoriy, fallback → master)
 *
 * Muhit o'zgaruvchilari:
 *   DATABASE_URL        — asosiy (write) ulanish
 *   SLAVE_DATABASE_URL  — replica (read) ulanish (ixtiyoriy)
 *
 * Foydalanish:
 *   @Inject(READ_DB)  private readonly readDb: CqrsDb
 *   @Inject(WRITE_DB) private readonly writeDb: CqrsDb
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool }    from 'pg';
import { DB_POOL_MAX_CONNECTIONS } from '@common/constants/app.constants';

export const READ_DB  = 'READ_DB'  as const;
export const WRITE_DB = 'WRITE_DB' as const;

export type CqrsDb = ReturnType<typeof drizzle>;

function createCqrsDb(url: string): CqrsDb {
  const pool = new Pool({ connectionString: url, max: DB_POOL_MAX_CONNECTIONS });
  return drizzle(pool);
}

/**
 * Write DB provider — har doim MASTER ga yozadi.
 */
export const WriteDatabaseProvider = {
  provide: WRITE_DB,
  useFactory: (): CqrsDb => {
    const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL muhit o\'zgaruvchisi belgilanmagan');
    return createCqrsDb(url);
  },
};

/**
 * Read DB provider — SLAVE_DATABASE_URL bo'lsa replica, bo'lmasa fallback master.
 * Ixtiyoriy: agar SLAVE_DATABASE_URL yo'q bo'lsa xatolik chiqarilmaydi.
 */
export const ReadDatabaseProvider = {
  provide: READ_DB,
  useFactory: (): CqrsDb => {
    const slaveUrl  = process.env.SLAVE_DATABASE_URL;
    const masterUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    const url = slaveUrl || masterUrl;
    if (!url) throw new Error('DATABASE_URL yoki SLAVE_DATABASE_URL belgilanmagan');
    return createCqrsDb(url);
  },
};

/**
 * SLAVE ulanish mavjudligini tekshirish.
 * True bo'lsa read replica faol.
 */
export function hasReadReplica(): boolean {
  return !!process.env.SLAVE_DATABASE_URL;
}
