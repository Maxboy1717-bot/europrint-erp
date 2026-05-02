import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as sharedSchema from '../../shared/db/schema';

const pool = new Pool({
  connectionString:
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@helium:5432/heliumdb',
  max: 10,
});

const drizzleDb = drizzle(pool, { schema: sharedSchema });

export const db = drizzleDb;

@Injectable()
export class Database {
  readonly db = drizzleDb;

  get query() {
    return drizzleDb.query;
  }

  select(...args: Parameters<typeof drizzleDb.select>) {
    return drizzleDb.select(...args);
  }

  insert(table: Parameters<typeof drizzleDb.insert>[0]) {
    return drizzleDb.insert(table);
  }

  update(table: Parameters<typeof drizzleDb.update>[0]) {
    return drizzleDb.update(table);
  }

  delete(table: Parameters<typeof drizzleDb.delete>[0]) {
    return drizzleDb.delete(table);
  }

  execute(query: Parameters<typeof drizzleDb.execute>[0]) {
    return drizzleDb.execute(query);
  }
}
