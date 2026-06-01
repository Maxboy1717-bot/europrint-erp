/**
 * @module schema-compat-helpers
 * @description Source module. See exports for details.
 */

import { timestamp } from 'drizzle-orm/pg-core';
export { pgTable, uuid, text, boolean, timestamp, decimal, integer, serial, varchar, jsonb } from 'drizzle-orm/pg-core';
export { createId } from '@paralleldrive/cuid2';
export const ts = (col: string) => timestamp(col, { withTimezone: true });
export const stub = <T extends object>(t: T): T => t;
