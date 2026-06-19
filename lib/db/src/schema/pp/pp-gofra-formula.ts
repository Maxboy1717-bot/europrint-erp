/**
 * @module pp-gofra-formula
 * @description Master-data for the Gofra/Sloy 3-formula conversion engine: the flute
 *   take-up factor table (Formula 3 coefficient source). Vision:
 *   CHAT-TARIXI-YANGI-2026-06-08.md §29 + owner decision #6 (MASSIV-50/00-EGASI-QARORLAR).
 *
 *   Why a table (not hardcode): CLAUDE.md Qoida 13 / Q-47 §13 — every unit-conversion
 *   coefficient is configurable master-data, never a literal in the logic. The pure
 *   `GofraConversionService` reads these factors via a repo; the repo falls back to the
 *   owner-#6 standard defaults when the table is empty, so the engine works pre-seed.
 *
 *   Note: per-material layer GSM/format already live in `material_cards` +
 *   `material_layer_config` (vision #7) — NOT re-created here (Q-46 no duplication).
 *   This table only owns the shared flute take-up coefficients.
 */

import { sql } from 'drizzle-orm';
import {
  serial,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  numeric,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * pp_flute_types — flute (to'lqin) take-up factors, configurable master-data.
 * `takeUpFactor` is nullable by design: the owner may enter a measured value, or
 * leave it null until measured. Owner-#6 supplied standard defaults
 * (A=1.54 B=1.36 C=1.45 E=1.27 BC=1.43) which the seed inserts and the repo falls
 * back to. take_up_factor must be > 0 when present.
 */
export const ppFluteTypes = pgTable(
  'pp_flute_types',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 5 }).notNull(),
    nameUz: text('name_uz').notNull(),
    nameRu: text('name_ru'),
    takeUpFactor: numeric('take_up_factor', { precision: 6, scale: 4 }),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('pp_flute_types_code_unique').on(t.code),
    check(
      'pp_flute_types_take_up_positive',
      sql`${t.takeUpFactor} IS NULL OR ${t.takeUpFactor} > 0`,
    ),
  ],
);

export const insertPpFluteTypeSchema = createInsertSchema(ppFluteTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export type PpFluteType = typeof ppFluteTypes.$inferSelect;
export type InsertPpFluteType = z.infer<typeof insertPpFluteTypeSchema>;
