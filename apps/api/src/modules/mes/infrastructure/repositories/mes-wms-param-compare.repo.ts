/**
 * @module mes-wms-param-compare.repo
 * @description 08-mes #24 — Sessiya Format/gramm (А×В + grammaj) ni WMS partiya (batch_lots)
 * material parametrlari bilan taqqoslash. Zanjir: production_sessions.format_a/format_b/gramm
 * (operator sessiyada kiritadi, #116 ustunlari) ↔ batch_lots.material_id → material_cards
 * .format_a/format_b/grammage. Har taqqoslash bitta mes_wms_param_checks qatori bo'ladi;
 * IKKALA tomonda ham mavjud (NULL emas) parametr farq qilsa — is_mismatch=true bayrog'i.
 *
 * Naqsh: MesBrakLimitRepository bilan bir xil — repo o'z DB'sini boshqaradi (Qoida 15),
 * raw SQL runQuery orqali (butun MES modulida shu uslub), taqqoslash mantig'i repo ichida
 * hisoblanadi va tuzilgan natija qaytariladi (servis safeCall bilan Result<T> ga o'raydi).
 * Hech qanday egasi-DATA/threshold/master-data KERAK EMAS — parametrlar faqat ikkala tomonda
 * bor bo'lsagina solishtiriladi, aks holda solishtirilmaydi (fail-safe).
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface WmsParamCheckResult {
  id: number;
  sessionId: number;
  batchLotId: number;
  materialId: number | null;
  comparedParams: number;
  isMismatch: boolean;
  mismatchDetail: string | null;
}

@Injectable()
export class MesWmsParamCompareRepository {
  private readonly logger = new Logger(MesWmsParamCompareRepository.name);

  /**
   * Bitta sessiya ↔ bitta WMS partiya taqqoslashi. Sessiya yoki partiya topilmasa null
   * (servis NOT_FOUND'ga aylantiradi). Ikkala tomonda mavjud har parametr solishtiriladi;
   * bittasi ham farq qilsa is_mismatch=true. Natija mes_wms_param_checks'ga yoziladi (audit +
   * FE'da qayta yuklashda ko'rinadi) va tuzilgan holda qaytariladi.
   */
  async compareSessionToBatch(
    sessionId: number,
    batchLotId: number,
    checkedBy: number | null,
  ): Promise<WmsParamCheckResult | null> {
    try {
      const snap = await runQuery<Row>(sql`
        SELECT
          ps.id          AS session_id,
          ps.format_a    AS s_format_a,
          ps.format_b    AS s_format_b,
          ps.gramm       AS s_gramm,
          bl.id          AS batch_lot_id,
          bl.material_id AS material_id,
          mc.format_a    AS w_format_a,
          mc.format_b    AS w_format_b,
          mc.grammage    AS w_grammage
        FROM production_sessions ps
        JOIN batch_lots bl ON bl.id = ${batchLotId}
        LEFT JOIN material_cards mc ON mc.id = bl.material_id
        WHERE ps.id = ${sessionId} AND ps.deleted_at IS NULL
      `);
      const r = snap.rows[0] as Row | undefined;
      if (!r) return null;

      const params: Array<[string, unknown, unknown]> = [
        ['format_a', r.s_format_a, r.w_format_a],
        ['format_b', r.s_format_b, r.w_format_b],
        ['gramm', r.s_gramm, r.w_grammage],
      ];
      let comparedParams = 0;
      let isMismatch = false;
      const detail: string[] = [];
      for (const [name, sv, wv] of params) {
        if (sv == null || wv == null) continue; // faqat IKKALA tomonda bor bo'lsa solishtiriladi
        comparedParams += 1;
        if (Number(sv) !== Number(wv)) {
          isMismatch = true;
          detail.push(`${name}: session=${String(sv)} vs wms=${String(wv)}`);
        }
      }
      const mismatchDetail = detail.length ? detail.join('; ') : null;
      const materialId = r.material_id != null ? Number(r.material_id) : null;

      const ins = await runQuery<Row>(sql`
        INSERT INTO mes_wms_param_checks
          (session_id, batch_lot_id, material_id,
           session_format_a, session_format_b, session_gramm,
           wms_format_a, wms_format_b, wms_grammage,
           compared_params, is_mismatch, mismatch_detail, checked_by, checked_at)
        VALUES (
          ${sessionId}, ${batchLotId}, ${materialId},
          ${(r.s_format_a ?? null) as number | null}, ${(r.s_format_b ?? null) as number | null}, ${(r.s_gramm ?? null) as number | null},
          ${(r.w_format_a ?? null) as number | null}, ${(r.w_format_b ?? null) as number | null}, ${(r.w_grammage ?? null) as number | null},
          ${comparedParams}, ${isMismatch}, ${mismatchDetail}, ${checkedBy}, NOW())
        RETURNING id
      `);
      const created = ins.rows[0] as Row | undefined;
      if (!created?.id) return null;

      return {
        id: Number(created.id),
        sessionId,
        batchLotId,
        materialId,
        comparedParams,
        isMismatch,
        mismatchDetail,
      };
    } catch (err) {
      this.logger.error(`compareSessionToBatch: ${(err as Error).message}`);
      return null;
    }
  }

  /** Sessiya uchun barcha WMS-parametr taqqoslashlari (eng yangi birinchi) — FE ko'rinishi. */
  async listChecksForSession(sessionId: number): Promise<Row[]> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT id, session_id, batch_lot_id, material_id,
               session_format_a, session_format_b, session_gramm,
               wms_format_a, wms_format_b, wms_grammage,
               compared_params, is_mismatch, mismatch_detail, checked_by, checked_at
        FROM mes_wms_param_checks
        WHERE session_id = ${sessionId}
        ORDER BY id DESC
      `);
      return rows.rows as Row[];
    } catch (err) {
      this.logger.error(`listChecksForSession: ${(err as Error).message}`);
      return [];
    }
  }
}
