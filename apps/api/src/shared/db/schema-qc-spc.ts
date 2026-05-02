import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * control_chart_point — TZ-D11: p-chart namunaviy nuqtalari jadvali
 *
 * Har yangi p-chart sample shu jadvalga yoziladi.
 * Oxirgi 25 nuqta asosida UCL/LCL qayta hisoblanadi.
 *
 * DB invariantlar:
 *   defects ≤ sample_size
 *   sample_size > 0
 */
export const control_chart_point = pgTable(
  'control_chart_point',
  {
    id:         text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    processId:  text('process_id').notNull(),
    sampleSize: integer('sample_size').notNull(),
    defects:    integer('defects').notNull(),
    timestamp:  timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    chkDefectsLeSize:   check('chk_defects_le_size',   sql`${t.defects} <= ${t.sampleSize}`),
    chkSizePositive:    check('chk_size_positive',      sql`${t.sampleSize} > 0`),
    idxProcessTime:     index('idx_chart_process_time').on(t.processId, t.timestamp),
  }),
);
