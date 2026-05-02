import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:password@helium:5432/heliumdb',
});

export const db = drizzle(pool);
