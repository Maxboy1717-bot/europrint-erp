/**
 * @module sd-contract-terms.repo
 * @description Repository / data-access layer for structured contract terms
 * (payment/penalty/penya/currency) on sd_contracts. Raw SQL via runQuery ->
 * Result<T>; owns DB access per Qoida 15 so the controller stays transport-only.
 * No Drizzle table-object import (avoids stale-dist rebuild) — raw SQL only.
 * @layer Infrastructure (SD)
 * Vision: 06-sd #78 — Shartnoma strukturalangan shartlar (to'lov/jarima/penya).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppErr } from '@common/result';

type Row = Record<string, unknown>;

/** Partial input; any omitted / null field leaves the existing DB value untouched (COALESCE). */
export interface ContractTermsInput {
  payment_terms?: string | null;
  penalty_rate?: number | null;
  penya_rate?: number | null;
  currency?: string | null;
}

@Injectable()
export class SdContractTermsRepository {
  /**
   * Set the structured terms on a live (non-deleted) contract. Partial upsert:
   * COALESCE keeps whatever the caller omits (undefined/null), so a form can save
   * one field without wiping the rest. Returns the updated row, or NOT_FOUND when
   * the contract id does not exist (or is soft-deleted).
   */
  async setTerms(id: number, input: ContractTermsInput): Promise<Result<Row>> {
    try {
      const paymentTerms = input.payment_terms ?? null;
      const penaltyRate = input.penalty_rate ?? null;
      const penyaRate = input.penya_rate ?? null;
      const currency = input.currency ?? null;
      const res = await runQuery<Row>(sql`
        UPDATE sd_contracts SET
          payment_terms = COALESCE(${paymentTerms}, payment_terms),
          penalty_rate  = COALESCE(${penaltyRate}::numeric, penalty_rate),
          penya_rate    = COALESCE(${penyaRate}::numeric, penya_rate),
          currency      = COALESCE(${currency}, currency),
          updated_at    = now()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, contract_number, payment_terms, penalty_rate, penya_rate, currency, updated_at
      `);
      const rows = Array.isArray(res.rows) ? res.rows : [];
      const row = rows[0];
      if (!row) return Err(AppErr('NOT_FOUND', `Contract ${id} topilmadi`));
      return Ok(row);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
