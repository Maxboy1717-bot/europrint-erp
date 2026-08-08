/**
 * @module crm-settings.repo
 * @description Repository for the manager-owned CRM vocabularies (Batch 5 Item 6):
 *   crm_loss_reasons (deal loss-reason taxonomy) + crm_stages (funnel stage names).
 *   Parameterized SQL via runQuery (same style as the other CRM repos), returns Result<T>.
 *   Both tables start empty — the CRM manager populates them via the settings UI (no owner seed).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof runQuery>[0]): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];

export interface LossReasonCreate { code: string; labelUz?: string; labelRu?: string; sortOrder?: number; }
export interface LossReasonUpdate { labelUz?: string; labelRu?: string; sortOrder?: number; isActive?: boolean; }
export interface StageCreate {
  name: string; nameRu?: string; sort?: number; color?: string;
  semantics: string; probability?: number; categoryId?: number; entityId?: string;
}
export interface StageUpdate { name?: string; nameRu?: string; sort?: number; color?: string; semantics?: string; probability?: number; }

@Injectable()
export class CrmSettingsRepository {
  // ── Loss reasons (crm_loss_reasons) ──────────────────────────────────
  async listLossReasons(includeInactive: boolean) {
    try {
      const rows = includeInactive
        ? await exec(sql`SELECT id, code, label_uz, label_ru, is_active, sort_order FROM crm_loss_reasons ORDER BY is_active DESC, sort_order, id`)
        : await exec(sql`SELECT id, code, label_uz, label_ru, is_active, sort_order FROM crm_loss_reasons WHERE is_active = true ORDER BY sort_order, id`);
      return Ok(rows);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async createLossReason(input: LossReasonCreate) {
    try {
      const dup = await exec(sql`SELECT id FROM crm_loss_reasons WHERE code = ${input.code} LIMIT 1`);
      if (dup[0]) return Err({ code: 'CONFLICT' as const, message: `Kod band: ${input.code}` });
      const r = await exec(sql`
        INSERT INTO crm_loss_reasons (code, label_uz, label_ru, sort_order)
        VALUES (${input.code}, ${input.labelUz ?? null}, ${input.labelRu ?? null}, ${input.sortOrder ?? 0})
        RETURNING id, code, label_uz, label_ru, is_active, sort_order`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async updateLossReason(id: number, patch: LossReasonUpdate) {
    try {
      const existing = await exec(sql`SELECT id FROM crm_loss_reasons WHERE id = ${id} LIMIT 1`);
      if (!existing[0]) return Err({ code: 'NOT_FOUND' as const, message: 'Sabab topilmadi' });
      const r = await exec(sql`
        UPDATE crm_loss_reasons SET
          label_uz   = COALESCE(${patch.labelUz ?? null}, label_uz),
          label_ru   = COALESCE(${patch.labelRu ?? null}, label_ru),
          sort_order = COALESCE(${patch.sortOrder ?? null}, sort_order),
          is_active  = COALESCE(${patch.isActive ?? null}, is_active)
        WHERE id = ${id}
        RETURNING id, code, label_uz, label_ru, is_active, sort_order`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  // ── Funnel stages (crm_stages) ───────────────────────────────────────
  async listStages(pipelineId?: number) {
    try {
      const rows = pipelineId !== undefined
        ? await exec(sql`SELECT id, status_id, entity_id, category_id, name, name_ru, sort, color, semantics, probability FROM crm_stages WHERE category_id = ${pipelineId} ORDER BY sort NULLS LAST, id`)
        : await exec(sql`SELECT id, status_id, entity_id, category_id, name, name_ru, sort, color, semantics, probability FROM crm_stages ORDER BY category_id NULLS LAST, sort NULLS LAST, id`);
      return Ok(rows);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async createStage(input: StageCreate) {
    try {
      // status_id is Bitrix-legacy: NOT NULL + UNIQUE, but no consumer reads specific values
      // (won/lost is derived from `semantics`). Assign the next free value so the manager never
      // has to know Bitrix internals. entity_id defaults to 'DEAL' (the deal funnel).
      const r = await exec(sql`
        INSERT INTO crm_stages (status_id, entity_id, category_id, name, name_ru, sort, color, semantics, probability)
        VALUES (
          (SELECT COALESCE(MAX(status_id), 0) + 1 FROM crm_stages),
          ${input.entityId ?? 'DEAL'}, ${input.categoryId ?? null}, ${input.name}, ${input.nameRu ?? null},
          ${input.sort ?? 0}, ${input.color ?? null}, ${input.semantics}, ${input.probability ?? null}
        )
        RETURNING id, status_id, entity_id, category_id, name, name_ru, sort, color, semantics, probability`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async updateStage(id: number, patch: StageUpdate) {
    try {
      const existing = await exec(sql`SELECT id FROM crm_stages WHERE id = ${id} LIMIT 1`);
      if (!existing[0]) return Err({ code: 'NOT_FOUND' as const, message: 'Bosqich topilmadi' });
      const r = await exec(sql`
        UPDATE crm_stages SET
          name        = COALESCE(${patch.name ?? null}, name),
          name_ru     = COALESCE(${patch.nameRu ?? null}, name_ru),
          sort        = COALESCE(${patch.sort ?? null}, sort),
          color       = COALESCE(${patch.color ?? null}, color),
          semantics   = COALESCE(${patch.semantics ?? null}, semantics),
          probability = COALESCE(${patch.probability ?? null}, probability)
        WHERE id = ${id}
        RETURNING id, status_id, entity_id, category_id, name, name_ru, sort, color, semantics, probability`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }
}
