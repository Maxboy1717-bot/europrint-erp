import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';

const pool = new Pool({
  connectionString:
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@helium:5432/heliumdb',
  max: 10,
});

export const db = drizzle(pool);

@Injectable()
export class DrizzleService {
  private readonly logger = new Logger(DrizzleService.name);
  readonly db = db;

  async ping(): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await db.select({ v: sql<number>`1` }).from(sql`(SELECT 1) _ping`);
    });
  }
}
