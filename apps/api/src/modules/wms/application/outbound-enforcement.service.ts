/**
 * @module outbound-enforcement.service
 * @description WMS chiqim hard-gate'lari (EP-WMS-084 / EP-WMS-085).
 *
 * Vizyon manba:
 *   - docs/audit/decisions/10-warehouse.md §EP-WMS-084 (v2 Q53):
 *     "texkarta material kodi ≠ chiqarilayotgan kod bo'lsa chiqim bloklanadi.
 *      Kitob aniq misol: топлайнер kerak, омборчи местный (макулатура) tayyorlagan → brak."
 *   - docs/audit/decisions/10-warehouse.md §EP-WMS-085 (v2 Q54):
 *     "har chiqim buyurtma+texkartaga bog'lanadi; ... 5-qavat va 3-qavat gofra
 *      aralashtirilgan → reja buzilgan."
 *
 * KANONIK MANBA = `tech_card_bom` jadvali (LIVE):
 *   columns: (technology_card_id, material_code, quantity, unit, layer)
 *   `material_code` → `material_cards.kod` bilan taqqoslanadi (EP-WMS-084).
 *   `layer`         → gofra qavat (masalan '3', '5') bilan taqqoslanadi (EP-WMS-085).
 *
 * Gate FAQAT texkarta BOM da material uchun YOZUV bo'lsa BLOK qiladi (honest):
 *   - BOM bo'sh / texkarta berilmagan → fail-open (loglanadi) — chiqimni TO'XTATMAYDI.
 *     Bu vizyonga mos: blok faqat aniq nomuvofiqlik aniqlanganda (Q53/Q54 — "mos kelmasa").
 *   - Material BOM da bor, lekin chiqarilayotgan kod ≠ BOM kodi → EP-WMS-084 BLOK.
 *   - Material BOM da bor, BOM layer ≠ chiqarilayotgan material layer → EP-WMS-085 BLOK.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

export type OutboundBlockCode =
  | 'BLOCK_TECH_CARD_MISMATCH'
  | 'BLOCK_GOFRA_LAYER_MISMATCH';

export interface EnforcementResult {
  allowed: boolean;
  blockCode: OutboundBlockCode | null;
  message: string | null;
}

export interface CheckIssueParams {
  /** Chiqarilayotgan material (warehouse_stock.material_id / material_cards.id). */
  materialId: number;
  /** Tekshirish kaliti — texkarta. Yo'q bo'lsa (null/0) gate fail-open bo'ladi. */
  technologyCardId: number | null;
  /**
   * Ixtiyoriy: chiqarilayotgan materialning gofra qavati (masalan 3 yoki 5).
   * Berilmasa EP-WMS-085 qavat tekshiruvi o'tkazib yuboriladi (qavat manbai yo'q).
   */
  issuedLayer?: number | null;
}

interface BomRow {
  bom_material_code: string;
  bom_layer: string | null;
  issued_material_code: string | null;
}

@Injectable()
export class OutboundEnforcementService {
  private readonly logger = new Logger(OutboundEnforcementService.name);

  /**
   * EP-WMS-084 + EP-WMS-085 — chiqimga ruxsat tekshiruvi.
   *
   * Mantiq:
   *   1. technologyCardId yo'q → fail-open (tekshiradigan reja yo'q).
   *   2. Texkarta BOM dan chiqarilayotgan material kodi bilan qatorni topishga urinadi:
   *      - Topilsa → material mos (EP-WMS-084 OK), keyin layer tekshiriladi (EP-WMS-085).
   *      - Topilmasa, lekin BOM da boshqa material bor → EP-WMS-084 BLOK
   *        (texkarta boshqa materialni talab qiladi).
   *      - BOM butunlay bo'sh → fail-open (texkarta hali to'ldirilmagan).
   */
  async checkIssueAllowed(params: CheckIssueParams): Promise<Result<EnforcementResult>> {
    const { materialId, technologyCardId, issuedLayer } = params;

    if (!technologyCardId) {
      // Texkarta bog'lanmagan chiqim — bloklanmaydi (vizyon: blok faqat aniq nomuvofiqlikda).
      return Ok({ allowed: true, blockCode: null, message: null });
    }

    try {
      // Bitta so'rov: chiqarilayotgan material kodini olib, shu texkarta BOM bilan LEFT JOIN.
      // bom_material_code = texkartada shu materialga MOS keluvchi kod (mos kelsa to'ladi);
      // bom_layer         = o'sha BOM qatori qavati (EP-WMS-085 uchun).
      const rows = await typedExecute<BomRow>(sql`
        SELECT
          tcb.material_code AS bom_material_code,
          tcb.layer         AS bom_layer,
          mc.kod            AS issued_material_code
        FROM material_cards mc
        LEFT JOIN tech_card_bom tcb
          ON tcb.technology_card_id = ${technologyCardId}
         AND tcb.material_code = mc.kod
        WHERE mc.id = ${materialId}
        LIMIT 1
      `);

      const row = rows[0];
      if (!row) {
        return Err(AppErr('NOT_FOUND', `Material topilmadi: id=${materialId}`));
      }

      // Chiqarilayotgan material texkarta BOM da bormi?
      if (row.bom_material_code !== null) {
        // EP-WMS-084 OK — material kodi texkartaga mos. Endi EP-WMS-085 (qavat).
        if (
          issuedLayer !== undefined &&
          issuedLayer !== null &&
          row.bom_layer !== null &&
          String(row.bom_layer).trim() !== '' &&
          Number(row.bom_layer) !== issuedLayer
        ) {
          const msg = `EP-WMS-085: Texkarta ${row.bom_layer}-qavat talab qiladi, chiqarilayotgan material ${issuedLayer}-qavat`;
          this.logger.warn({ code: 'EP-WMS-085', technologyCardId, materialId, bomLayer: row.bom_layer, issuedLayer }, msg);
          return Ok({ allowed: false, blockCode: 'BLOCK_GOFRA_LAYER_MISMATCH', message: msg });
        }
        return Ok({ allowed: true, blockCode: null, message: null });
      }

      // Material BOM da topilmadi → texkartada umuman yozuv bormi?
      const bomCount = await typedExecute<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n FROM tech_card_bom WHERE technology_card_id = ${technologyCardId}
      `);
      const hasBom = (bomCount[0]?.n ?? 0) > 0;

      if (hasBom) {
        // Texkarta BOM bor, lekin chiqarilayotgan material unda yo'q → EP-WMS-084 BLOK.
        const msg = `EP-WMS-084: Chiqarilayotgan material (kod=${row.issued_material_code}) texkarta (id=${technologyCardId}) BOM ida yo'q — texkarta-material mos kelmadi`;
        this.logger.warn({ code: 'EP-WMS-084', technologyCardId, materialId, issuedCode: row.issued_material_code }, msg);
        return Ok({ allowed: false, blockCode: 'BLOCK_TECH_CARD_MISMATCH', message: msg });
      }

      // BOM bo'sh (texkarta hali to'ldirilmagan) → fail-open.
      this.logger.log(
        { code: 'EP-WMS-084-OPEN', technologyCardId, materialId },
        'Texkarta BOM bo\'sh — chiqim bloklanmaydi (fail-open)',
      );
      return Ok({ allowed: true, blockCode: null, message: null });
    } catch (e) {
      // Tekshiruv DB xatosi chiqimni TO'XTATMAYDI (fail-open), lekin loglanadi.
      this.logger.error(
        { code: 'EP-WMS-ENFORCE-ERR', materialId, technologyCardId, error: String(e) },
        'Outbound enforcement tekshiruvida xato — fail-open',
      );
      return Ok({ allowed: true, blockCode: null, message: null });
    }
  }
}
