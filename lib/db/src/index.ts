import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

export {
  sql,
  eq,
  ne,
  and,
  or,
  not,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  between,
  notBetween,
  like,
  notLike,
  ilike,
  notIlike,
  desc,
  asc,
  count,
  countDistinct,
  avg,
  sum,
  max,
  min,
  placeholder,
} from "drizzle-orm";

export type { SQL, SQLWrapper } from "drizzle-orm";
