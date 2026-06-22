/**
 * @module doc-sequences.helper
 * @description Atomic, race-free human-readable document numbers via per-prefix Postgres
 * SEQUENCEs (the same proven pattern as finance `invoice_number_seq`). Replaces
 * `PREFIX-${Date.now()}` codegen, which risks millisecond collisions in batch inserts
 * (e.g. MPS planning opens many production orders in one tick) and is not human-readable.
 *
 * Sequences are created idempotently at boot in invariants/migrations-schema.ts.
 * Format: PREFIX-YYYY-NNNNNN  (e.g. PO-2026-000042) — mirrors INV-YYYY-NNNNNN.
 *
 * Scope: only prefixes whose order/document number has NO strict format validator and is
 * never parsed downstream (PO, MES). DLV/SO keep PREFIX-\d{10} validators and are migrated
 * separately with a matching numeric-only format.
 */

import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/** Whitelist: document prefix -> backing sequence name (must exist in migrations-schema). */
const SEQ_BY_PREFIX: Record<string, string> = {
  PO: 'doc_seq_po',
  MES: 'doc_seq_mes',
};

/**
 * Next document number for `prefix`. Atomic + monotonic (no two callers get the same number).
 * Falls back to a timestamp-based code if the prefix is unknown or its sequence is missing,
 * so a numbering hiccup never blocks the underlying write.
 */
export async function nextDocNumber(prefix: string): Promise<string> {
  const seqName = SEQ_BY_PREFIX[prefix];
  const year = new Date().getFullYear();
  if (!seqName) return `${prefix}-${Date.now()}`;
  try {
    // seqName is a fixed whitelist value (never user input); ::regclass resolves it at runtime.
    const r = await runQuery<{ seq: string }>(sql`SELECT nextval(${seqName}::regclass) AS seq`);
    const seq = String(r.rows[0]?.seq ?? Date.now());
    return `${prefix}-${year}-${seq.padStart(6, '0')}`;
  } catch {
    return `${prefix}-${Date.now()}`;
  }
}
