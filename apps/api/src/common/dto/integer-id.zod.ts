/**
 * @module integer-id.zod
 * @description Shared Zod schema for the ERP's INTEGER primary/foreign keys.
 *
 * WHY THIS EXISTS
 *   Audit 2026-08-07 found 57 `z.string().uuid()` fields across 29 DTO files. `main-bootstrap.ts`
 *   registers a global `ZodValidationPipe`, so those are real gates — and roughly half of them sit
 *   in front of columns that are INTEGER in the live schema (`users.id`, `employees.id`,
 *   `sales_orders.id`, `vendors.id`, `iot_devices.id`, …). Any endpoint behind one of those
 *   returned 400 for EVERY possible caller: not a bug you can hit, a bug you cannot avoid. The
 *   endpoints looked implemented, passed typecheck, and were unreachable (Q-40).
 *
 *   The schema is genuinely mixed — `cc_documents`, `kanban_tasks`, `ow_molds`, `aisha_*`,
 *   `qc_defects.production_order_id`, `downtime_events.work_center_id` and
 *   `work_centers.certification_lms_course_id` really are UUID. So this is NOT a blanket
 *   replacement: each field was checked against `information_schema` before being switched, and
 *   the genuinely-UUID ones were left alone.
 *
 * WHEN TO USE
 *   Use `IntegerIdSchema` when the value is stored in / compared against an INTEGER column and the
 *   consumer wants a string (most CQRS commands here take `string` ids). Use
 *   `IntegerIdNumberSchema` when the consumer wants a number. Do NOT use either for a column that
 *   is actually `uuid` — verify with:
 *     node _audit/q.cjs "SELECT data_type FROM information_schema.columns
 *                        WHERE table_name='<t>' AND column_name='<c>'"
 *
 *   Both accept a JSON number or a numeric string, because FE query strings and form payloads send
 *   ids as strings while JSON bodies often send them as numbers.
 */

import { z } from 'zod';

const INTEGER_ID_MESSAGE = "ID musbat butun son bo'lishi kerak";

/** Positive integer id, normalised to its string form. */
export const IntegerIdSchema = z
  .union([z.number().int().positive(), z.string().regex(/^[1-9]\d*$/, INTEGER_ID_MESSAGE)])
  .transform((v) => String(v));

/** Positive integer id, normalised to a number. */
export const IntegerIdNumberSchema = z
  .union([z.number().int().positive(), z.string().regex(/^[1-9]\d*$/, INTEGER_ID_MESSAGE)])
  .transform((v) => Number(v));
