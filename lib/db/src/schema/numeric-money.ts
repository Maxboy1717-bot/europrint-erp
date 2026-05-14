/**
 * @module numeric-money
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { customType } from "drizzle-orm/pg-core";

/**
 * PostgreSQL NUMERIC(18,4) column mapped to TypeScript `number`.
 *
 * - DB type  : NUMERIC(18, 4) — exact decimal, no float rounding errors
 * - TS type  : number — arithmetic works without changes in route handlers
 * - Zod type : z.number() — drizzle-zod reads `column.dataType === 'number'`
 *
 * Use in place of `doublePrecision` for all monetary / quantity fields.
 */
export const numericMoney = (name: string) => {
  const builder = customType<{ data: number; driverData: string }>({
    dataType() {
      return "numeric(18, 4)";
    },
    fromDriver(value: string): number {
      return parseFloat(value ?? "0") || 0;
    },
    toDriver(value: number): string {
      return String(value ?? 0);
    },
  })(name);

  // drizzle-zod reads `column.dataType` to select the Zod schema.
  // Patching 'custom' → 'number' makes createInsertSchema emit z.number()
  // instead of z.any(), preserving strict type safety for all insert schemas.
  (builder as unknown as { dataType: string }).dataType = "number";

  return builder;
};
