/**
 * @module pos-variance-config.service
 * @description POS Monitor — inventarizatsiya FARQI avto-tasdiq chegarasi (P4).
 *
 * Vizyon manba (docs/audit/decisions/10-warehouse.md):
 *   "Inventar farqi chegarasi — avto-tasdiq limiti; oshsa menejer-tasdiq (escalate)."
 *
 * Bu servis FAQAT `pos_variance_config` (P4 migration) ni o'qiydi/yozadi va
 * bitta farq satrini chegaraga solishtirib AUTO_APPROVE / ESCALATE qaroriga
 * keladi. Mavjud `pos-inventory-count.service.ts` oqimi BUZILMAYDI (Q-46):
 * bu servis qaror BERADI, lekin tasdiqni o'zi qo'llamaydi — chaqiruvchi
 * (inventory-count) avto-tasdiqni qo'llaydi yoki menejerga eskalatsiya qiladi.
 *
 * Q-40 (fabrikatsiya yo'q): chegara qiymatlari DB'dan keladi (egasi-DATA);
 * config qatori yo'q bo'lsa — global default qatoriga, u ham yo'q bo'lsa —
 * xavfsiz fallback (0% / 0 so'm = HAMMASI eskalatsiya) ishlatiladi, ya'ni
 * config yo'qligida hech narsa avto-tasdiqlanmaydi (fail-CLOSED — menejerga).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

export type VarianceDecision = 'AUTO_APPROVE' | 'ESCALATE';

export interface VarianceThreshold {
  /** Avto-tasdiq miqdor-farqi chegarasi (foiz). */
  autoApproveQtyPct: number;
  /** Avto-tasdiq qiymat-farqi chegarasi (so'm, absolyut). */
  autoApproveValueUzs: number;
  /** Qaysi config qatori ishlatildi: 'warehouse' | 'global' | 'fallback'. */
  source: 'warehouse' | 'global' | 'fallback';
}

export interface VarianceLineInput {
  /** Tizim (kutilgan) miqdori — foiz hisoblash uchun maxraj. */
  systemQty: number;
  /** Miqdor farqi (counted − system); ishorasi muhim emas — abs olinadi. */
  varianceQty: number;
  /** Qiymat farqi (so'm) — ixtiyoriy; berilmasa 0 deb olinadi. */
  varianceValue?: number | null;
}

export interface VarianceDecisionResult {
  decision: VarianceDecision;
  /** Hisoblangan miqdor-farqi foizi (|variance|/system*100). */
  qtyPct: number;
  /** Hisoblangan absolyut qiymat-farqi (so'm). */
  valueAbs: number;
  threshold: VarianceThreshold;
  /** ESCALATE bo'lsa sabab (qaysi chegara oshdi). */
  reason: string | null;
}

/** Config butunlay yo'q bo'lsa — fail-CLOSED (hech narsa avto-tasdiqlanmaydi). */
const FALLBACK_THRESHOLD: VarianceThreshold = {
  autoApproveQtyPct: 0,
  autoApproveValueUzs: 0,
  source: 'fallback',
};

interface ConfigRow {
  auto_approve_qty_pct: string | number | null;
  auto_approve_value_uzs: string | number | null;
}

@Injectable()
export class PosVarianceConfigService {
  private readonly logger = new Logger(PosVarianceConfigService.name);

  /**
   * Ombor uchun amaldagi chegarani o'qiydi: avval ombor-doirasidagi faol
   * config, bo'lmasa global default (warehouse_id IS NULL), u ham bo'lmasa
   * fail-CLOSED fallback.
   */
  async getThreshold(warehouseId: number | null): Promise<Result<VarianceThreshold>> {
    try {
      if (warehouseId != null && Number.isFinite(warehouseId)) {
        const wh = await typedExecute<ConfigRow>(sql`
          SELECT auto_approve_qty_pct, auto_approve_value_uzs
          FROM pos_variance_config
          WHERE warehouse_id = ${warehouseId} AND is_active = TRUE
          LIMIT 1
        `);
        const row = wh[0];
        if (row) {
          return Ok({
            autoApproveQtyPct: Number(row.auto_approve_qty_pct ?? 0),
            autoApproveValueUzs: Number(row.auto_approve_value_uzs ?? 0),
            source: 'warehouse',
          });
        }
      }

      const glob = await typedExecute<ConfigRow>(sql`
        SELECT auto_approve_qty_pct, auto_approve_value_uzs
        FROM pos_variance_config
        WHERE warehouse_id IS NULL AND is_active = TRUE
        LIMIT 1
      `);
      const g = glob[0];
      if (g) {
        return Ok({
          autoApproveQtyPct: Number(g.auto_approve_qty_pct ?? 0),
          autoApproveValueUzs: Number(g.auto_approve_value_uzs ?? 0),
          source: 'global',
        });
      }

      // Config umuman yo'q — fail-CLOSED (menejerga eskalatsiya).
      this.logger.warn(
        { warehouseId },
        'pos_variance_config topilmadi — fail-CLOSED (hech narsa avto-tasdiqlanmaydi)',
      );
      return Ok(FALLBACK_THRESHOLD);
    } catch (e) {
      this.logger.error({ warehouseId, error: String(e) }, 'getThreshold xatosi — fail-CLOSED');
      return Ok(FALLBACK_THRESHOLD);
    }
  }

  /**
   * Bitta farq satri uchun qaror: AUTO_APPROVE (chegara ichida) yoki
   * ESCALATE (chegaradan oshdi — menejer-tasdiq kerak).
   *
   * Mantiq: miqdor-farqi foizi VA qiymat-farqi ikkalasi ham chegara ichida
   * bo'lsa → AUTO_APPROVE. Biri ham oshsa → ESCALATE. system_qty = 0 bo'lsa
   * (yangi material) farq foizi cheksiz deb olinadi → ESCALATE (xavfsiz).
   */
  async decideForLine(
    warehouseId: number | null,
    line: VarianceLineInput,
  ): Promise<Result<VarianceDecisionResult>> {
    const thR = await this.getThreshold(warehouseId);
    if (!thR.ok) return Err(thR.error);
    const threshold = thR.data;

    const systemQty = Number(line.systemQty ?? 0);
    const varianceQty = Math.abs(Number(line.varianceQty ?? 0));
    const valueAbs = Math.abs(Number(line.varianceValue ?? 0));

    // Farq yo'q — har doim avto-tasdiq (tasdiqlash kerak emas).
    if (varianceQty === 0 && valueAbs === 0) {
      return Ok({ decision: 'AUTO_APPROVE', qtyPct: 0, valueAbs: 0, threshold, reason: null });
    }

    // Foiz: system_qty=0 bo'lsa (yangi material) — chegarasiz katta → ESCALATE.
    const qtyPct = systemQty > 0 ? (varianceQty / systemQty) * 100 : Number.POSITIVE_INFINITY;

    const qtyExceeds = qtyPct > threshold.autoApproveQtyPct;
    const valueExceeds = valueAbs > threshold.autoApproveValueUzs;

    if (qtyExceeds || valueExceeds) {
      const parts: string[] = [];
      if (qtyExceeds) {
        const shownPct = Number.isFinite(qtyPct) ? `${qtyPct.toFixed(2)}%` : 'cheksiz (system=0)';
        parts.push(`miqdor-farqi ${shownPct} > ${threshold.autoApproveQtyPct}%`);
      }
      if (valueExceeds) {
        parts.push(`qiymat-farqi ${valueAbs} so'm > ${threshold.autoApproveValueUzs} so'm`);
      }
      return Ok({
        decision: 'ESCALATE',
        qtyPct: Number.isFinite(qtyPct) ? qtyPct : 0,
        valueAbs,
        threshold,
        reason: `Chegara oshdi (${threshold.source}): ${parts.join('; ')}`,
      });
    }

    return Ok({ decision: 'AUTO_APPROVE', qtyPct, valueAbs, threshold, reason: null });
  }

  /**
   * Inventarizatsiya butun bo'yicha qaror: har satr tekshiriladi; biror satr
   * ESCALATE bo'lsa — butun count menejer-tasdiqqa boradi. Hammasi chegara
   * ichida bo'lsa — count avto-tasdiqlanishi mumkin.
   */
  async decideForCount(
    warehouseId: number | null,
    lines: VarianceLineInput[],
  ): Promise<Result<{ decision: VarianceDecision; escalatedLines: number; threshold: VarianceThreshold; reasons: string[] }>> {
    const thR = await this.getThreshold(warehouseId);
    if (!thR.ok) return Err(thR.error);
    const threshold = thR.data;

    const safeLines = Array.isArray(lines) ? lines : [];
    const reasons: string[] = [];
    let escalatedLines = 0;

    for (const line of safeLines) {
      const dR = await this.decideForLine(warehouseId, line);
      if (!dR.ok) return Err(dR.error);
      if (dR.data.decision === 'ESCALATE') {
        escalatedLines += 1;
        if (dR.data.reason) reasons.push(dR.data.reason);
      }
    }

    return Ok({
      decision: escalatedLines > 0 ? 'ESCALATE' : 'AUTO_APPROVE',
      escalatedLines,
      threshold,
      reasons,
    });
  }

  /**
   * Ombor uchun chegarani belgilash/yangilash (egasi-DATA). warehouseId=null →
   * global default yangilanadi. Idempotent upsert.
   */
  async setThreshold(
    warehouseId: number | null,
    autoApproveQtyPct: number,
    autoApproveValueUzs: number,
    notes?: string,
  ): Promise<Result<VarianceThreshold>> {
    try {
      const pct = Number(autoApproveQtyPct);
      const val = Number(autoApproveValueUzs);
      if (!Number.isFinite(pct) || pct < 0) return Err(AppErr('VALIDATION', "auto_approve_qty_pct manfiy bo'lmasligi kerak"));
      if (!Number.isFinite(val) || val < 0) return Err(AppErr('VALIDATION', "auto_approve_value_uzs manfiy bo'lmasligi kerak"));

      if (warehouseId == null) {
        await typedExecute(sql`
          UPDATE pos_variance_config
          SET auto_approve_qty_pct = ${pct}, auto_approve_value_uzs = ${val},
              notes = COALESCE(${notes ?? null}, notes), updated_at = NOW()
          WHERE warehouse_id IS NULL
        `);
        return Ok({ autoApproveQtyPct: pct, autoApproveValueUzs: val, source: 'global' });
      }

      // Per-ombor: upsert. UNIQUE indeks COALESCE(warehouse_id, -1) ustida —
      // shuning uchun ON CONFLICT shu ifodaga mos kelishi kerak.
      await typedExecute(sql`
        INSERT INTO pos_variance_config (warehouse_id, auto_approve_qty_pct, auto_approve_value_uzs, notes)
        VALUES (${warehouseId}, ${pct}, ${val}, ${notes ?? null})
        ON CONFLICT (COALESCE(warehouse_id, -1)) DO UPDATE
        SET auto_approve_qty_pct = EXCLUDED.auto_approve_qty_pct,
            auto_approve_value_uzs = EXCLUDED.auto_approve_value_uzs,
            notes = COALESCE(EXCLUDED.notes, pos_variance_config.notes),
            updated_at = NOW()
      `);
      return Ok({ autoApproveQtyPct: pct, autoApproveValueUzs: val, source: 'warehouse' });
    } catch (e) {
      return Err(AppErr('INTERNAL', String(e)));
    }
  }
}
