/**
 * @module typed-execute
 * @description Source module. See exports for details.
 */

import { sql } from 'drizzle-orm';
import { db } from './schema';

/**
 * Typed wrapper for db.execute() — avoids repeated `as unknown as { rows: T[] }` casts.
 * Use instead of casting the raw Drizzle execute result.
 */
export async function typedExecute<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  // RULE4_EXCEPTION: this helper exists exclusively to wrap `db.execute`
  // with a type-safe row cast. Callers that hit this path already need
  // raw SQL (per project rule, Drizzle builders are preferred elsewhere).
  const r = await db.execute(query);
  return (r as unknown as { rows: T[] }).rows;
}
