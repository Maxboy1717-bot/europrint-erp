/**
 * @module crm-dedup.repository
 * @description Repository / data-access layer for CRM lead phone-dedup + merge.
 *   Detects active leads that share the same phone once formatting is stripped
 *   (spaces / dashes / parentheses — the same normalisation the PhoneNumber value
 *   object applies) and merges a duplicate into a canonical lead by repointing its
 *   activity rows and soft-deleting the duplicate. Wraps Drizzle; returns Result<T>.
 * @layer Infrastructure (CRM)
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

export interface DuplicateGroup {
  normalized_phone: string;
  lead_count: number;
  lead_ids: number[];
}

export interface MergeResult {
  canonical_id: number;
  duplicate_id: number;
  canonical_phone: string | null;
  crm_activities_repointed: number;
  sd_lead_activities_repointed: number;
  duplicate_deleted_at: string | null;
}

// Strip spaces / dashes / parentheses in SQL — mirrors PhoneNumber.create()'s
// `raw.replace(/[\s\-()]/g, '')` so grouping matches the value object's normalisation.
const NORM_SQL = sql`regexp_replace(contact_phone, '[[:space:]()-]', '', 'g')`;

@Injectable()
export class CrmDedupRepository {
  /** Group active (non-soft-deleted) leads by normalised phone; groups with >1 lead = duplicates. */
  async findPhoneDuplicates(): Promise<Result<DuplicateGroup[]>> {
    return safeCall(async () => {
      const res = await db.execute(sql`
        SELECT
          ${NORM_SQL}              AS normalized_phone,
          COUNT(*)::int            AS lead_count,
          array_agg(id ORDER BY id) AS lead_ids
        FROM crm_leads
        WHERE deleted_at IS NULL
          AND contact_phone IS NOT NULL
          AND ${NORM_SQL} <> ''
        GROUP BY 1
        HAVING COUNT(*) > 1
        ORDER BY lead_count DESC, normalized_phone
      `);
      return castTo<DuplicateGroup[]>(res.rows ?? []);
      }, 'DB_ERROR');
  }

  /** Fetch a lead's id, contact_phone and soft-delete flag for merge validation. */
  async findLeadForMerge(lid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const res = await db.execute(sql`
        SELECT id, contact_phone, deleted_at
        FROM crm_leads WHERE id = ${lid} LIMIT 1
      `);
      return (res.rows?.[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  /**
   * Merge `duplicateId` into `canonicalId` in ONE transaction:
   *   1. repoint crm_activities.lead_id    dup -> canonical
   *   2. repoint sd_lead_activities.lead_id dup -> canonical
   *   3. write the normalised phone onto the surviving canonical (kept if empty)
   *   4. soft-delete the duplicate (deleted_at = NOW())
   * Returns affected-row counts + resulting state for verification (Q-40 proof).
   */
  async mergeLeads(canonicalId: number, duplicateId: number, normalizedPhone: string): Promise<Result<MergeResult>> {
    return safeCall(async () => {
      return db.transaction(async (tx) => {
        const crmAct = await tx.execute(sql`
          UPDATE crm_activities SET lead_id = ${canonicalId}, updated_at = NOW()
          WHERE lead_id = ${duplicateId}
        `);
        const sdAct = await tx.execute(sql`
          UPDATE sd_lead_activities SET lead_id = ${canonicalId}
          WHERE lead_id = ${duplicateId}
        `);
        await tx.execute(sql`
          UPDATE crm_leads
          SET contact_phone = COALESCE(NULLIF(${normalizedPhone}, ''), contact_phone),
              updated_at    = NOW()
          WHERE id = ${canonicalId}
        `);
        const dupRes = await tx.execute(sql`
          UPDATE crm_leads SET deleted_at = NOW(), updated_at = NOW()
          WHERE id = ${duplicateId} AND deleted_at IS NULL
          RETURNING deleted_at
        `);
        const dupRow = (dupRes.rows?.[0] ?? null) as { deleted_at?: unknown } | null;
        return {
          canonical_id: canonicalId,
          duplicate_id: duplicateId,
          canonical_phone: normalizedPhone || null,
          crm_activities_repointed: (crmAct as { rowCount?: number }).rowCount ?? 0,
          sd_lead_activities_repointed: (sdAct as { rowCount?: number }).rowCount ?? 0,
          duplicate_deleted_at: dupRow?.deleted_at != null ? String(dupRow.deleted_at) : null,
        } as MergeResult;
      });
      }, 'DB_ERROR');
  }
}
