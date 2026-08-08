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
  // FAZA D (Hujjat/PDF akt, 2026-07-01): POS Monitor kategoriya-bo'yicha akt raqamlari.
  // APPROVED: egasi vizyon-qurish 2026-07-01, FAZA D.
  'KIRIM-AKT':     'doc_seq_kirim_akt',
  'CHIQIM-AKT':    'doc_seq_chiqim_akt',
  'KOCHIRISH-AKT': 'doc_seq_kochirish_akt',
  'INV-AKT':       'doc_seq_inv_akt',
  'ZARAR-AKT':     'doc_seq_zarar_akt',
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

// ─── G1-3 OMBOR-PREFIKSLI hujjat raqamlash (2026-07-02) ─────────────────────
//
// Vizyon (OMBOR-KASSIR-INTERVYU-2026-06-08.md §13, 29-savol): raqam =
// OMBOR + harakat-turi + yil + ketma-ket, masalan `HOM-KIRIM-2026-00001`.
// Har <ombor-prefiks>-<TUR> jufti O'Z atomik Postgres sequence'iga ega
// (nextDocNumber bilan bir xil isbotlangan naqsh) — poyga holatida ham ikki
// chaqiruvchi bir xil raqam olmaydi. Ombor ro'yxati dinamik (yangi ombor
// qo'shilishi mumkin) — sequence'lar CREATE SEQUENCE IF NOT EXISTS bilan
// idempotent yaratiladi va jarayon ichida keshlansin (takror DDL yo'q).
// ESKI raqamlar (KIRIM-AKT-*/POS-*) o'zgarmaydi (Q-39) — bu faqat YANGI
// hujjatlar uchun; xato bo'lsa null qaytadi va chaqiruvchi eski fallback'ka o'tadi.

/** Jarayon ichida allaqachon yaratilgan (ensured) sequence nomlari keshi. */
const ensuredWarehouseSeqs = new Set<string>();

/**
 * Ombor-prefiksli hujjat raqami: `<OMBORKOD>-<TUR>-<YIL>-<NNNNN>`.
 * @param warehouseCode — warehouses.code (masalan `RM-MAIN`); faqat A-Z0-9 qoladi, maks 8 belgi
 * @param category — harakat kategoriyasi (KIRIM/CHIQIM/KOCHIRISH/INVENTARIZATSIYA/ZARAR)
 * @returns raqam yoki null (chaqiruvchi mavjud fallback raqamlashga o'tadi — yozuv hech qachon bloklanmaydi)
 */
export async function nextWarehouseDocNumber(
  warehouseCode: string,
  category: string,
): Promise<string | null> {
  const whPrefix = warehouseCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
  const cat = category.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 20);
  if (!whPrefix || !cat) return null;

  const seqName = `doc_seq_wh_${whPrefix.toLowerCase()}_${cat.toLowerCase()}`;
  // Postgres identifikator chegarasi 63 belgi + qat'iy whitelist (faqat [a-z0-9_]).
  if (!/^[a-z0-9_]{1,63}$/.test(seqName)) return null;

  const year = new Date().getFullYear();
  try {
    if (!ensuredWarehouseSeqs.has(seqName)) {
      // NOTE: DDL identifikatorini parametrlash mumkin emas; seqName yuqorida
      // qat'iy sanitatsiya qilingan literal ([a-z0-9_] whitelist, user-input
      // to'g'ridan kirmaydi — warehouses.code dan A-Z0-9 gina olinadi).
      await runQuery(sql.raw(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START 1`));
      ensuredWarehouseSeqs.add(seqName);
    }
    const r = await runQuery<{ seq: string }>(sql`SELECT nextval(${seqName}::regclass) AS seq`);
    const seq = String(r.rows[0]?.seq ?? '');
    if (!seq) return null;
    return `${whPrefix}-${cat}-${year}-${seq.padStart(5, '0')}`;
  } catch {
    // Raqamlash xatosi yozuvni bloklamaydi — chaqiruvchi eski raqamlashga qaytadi.
    return null;
  }
}
