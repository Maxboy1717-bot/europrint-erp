/**
 * @module pos-techcard-gate.service
 * @description POS Monitor — texkarta-material mosligi CHIQIMDAN OLDIN blok (P4).
 *
 * Vizyon manba (docs/audit/decisions/10-warehouse.md):
 *   §EP-WMS-084 — texkarta material kodi ≠ chiqarilayotgan kod → BLOK.
 *   §EP-WMS-085 — gofra qavat mos kelmasa → BLOK.
 *   "Buyurtma o'zgarishi — chiqarilgan materialga qayta-tekshiruv."
 *
 * ⭐ DUBLIKAT YOZILMAYDI: solishtirish mantig'i WMS'dagi
 *    `OutboundEnforcementService.checkIssueAllowed` (tech_card_bom ↔ material_cards)
 *    da bir marta yozilgan — bu servis SHU klassni IMPORT/REUSE qiladi
 *    (PosModule providers'ida ham ro'yxatdan o'tkaziladi). Bu yerda faqat:
 *      1) POS chiqim qatorlarini gate'ga uzatish (texkarta yo'q → no-op),
 *      2) movement ↔ texkarta bog'lanishini saqlash (buyurtma-o'zgarish uchun),
 *      3) buyurtma-o'zgarishda saqlangan chiqimlarni qayta-tekshirish.
 *
 * ADDITIVE (Q-46): texkarta berilmasa hech narsa bloklanmaydi — mavjud POS
 * chiqim oqimi o'zgarmaydi (regress YO'Q). Q-40: chegara/material kodi DB'dan
 * (tech_card_bom + material_cards) — fabrikatsiya yo'q.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { OutboundEnforcementService } from '../../../wms/application/outbound-enforcement.service';

export interface TechCardGateLine {
  /** Chiqarilayotgan material (material_cards.id / warehouse_stock.material_id). */
  materialCardId: number;
  /** Ixtiyoriy gofra qavati (EP-WMS-085). */
  issuedLayer?: number | null;
}

export interface TechCardGateBlock {
  materialCardId: number;
  blockCode: string;
  message: string;
}

export interface TechCardGateResult {
  allowed: boolean;
  blocks: TechCardGateBlock[];
}

@Injectable()
export class PosTechCardGateService {
  private readonly logger = new Logger(PosTechCardGateService.name);

  constructor(private readonly enforcement: OutboundEnforcementService) {}

  /**
   * Chiqim qatorlarini texkartaga solishtirib tekshiradi (EP-WMS-084/085).
   * technologyCardId yo'q (null/0) → barcha qatorlar o'tadi (no-op, regress YO'Q).
   * Biror qator mos kelmasa → allowed=false + blocks ro'yxati.
   */
  async checkLines(
    technologyCardId: number | null,
    lines: TechCardGateLine[],
  ): Promise<Result<TechCardGateResult>> {
    if (!technologyCardId) {
      return Ok({ allowed: true, blocks: [] });
    }
    const safeLines = Array.isArray(lines) ? lines : [];
    const blocks: TechCardGateBlock[] = [];

    for (const line of safeLines) {
      const gate = await this.enforcement.checkIssueAllowed({
        materialId: line.materialCardId,
        technologyCardId,
        issuedLayer: line.issuedLayer ?? null,
      });
      if (!gate.ok) return Err(gate.error);
      if (!gate.data.allowed) {
        blocks.push({
          materialCardId: line.materialCardId,
          blockCode: gate.data.blockCode ?? 'BLOCK_TECH_CARD_MISMATCH',
          message: gate.data.message ?? 'Texkarta-material mos kelmadi',
        });
      }
    }

    return Ok({ allowed: blocks.length === 0, blocks });
  }

  /**
   * movement ↔ texkarta bog'lanishini + gate natijasini saqlaydi (upsert).
   * Buyurtma-o'zgarish handleri shu bog'lanishni qayta-tekshirish uchun ishlatadi.
   */
  async recordLink(
    movementId: number,
    technologyCardId: number,
    issuedLayer: number | null,
    gate: TechCardGateResult,
  ): Promise<Result<void>> {
    try {
      const gateBlocks = Array.isArray(gate.blocks) ? gate.blocks : [];
      const gateResult = gate.allowed ? 'ALLOWED' : (gateBlocks[0]?.blockCode ?? 'BLOCKED');
      const gateMessage = gate.allowed ? null : gateBlocks.map((b) => b.message).join(' | ');
      await typedExecute(sql`
        INSERT INTO pos_movement_techcard (movement_id, technology_card_id, issued_layer, gate_result, gate_message)
        VALUES (${movementId}, ${technologyCardId}, ${issuedLayer}, ${gateResult}, ${gateMessage})
        ON CONFLICT (movement_id) DO UPDATE
        SET technology_card_id = EXCLUDED.technology_card_id,
            issued_layer       = EXCLUDED.issued_layer,
            gate_result        = EXCLUDED.gate_result,
            gate_message       = EXCLUDED.gate_message,
            updated_at         = NOW()
      `);
      return Ok(undefined);
    } catch (e) {
      // Saqlash xatosi chiqimni TO'XTATMAYDI (audit-only), lekin loglanadi.
      this.logger.warn({ movementId, error: String(e) }, 'pos_movement_techcard saqlash xatosi');
      return Ok(undefined);
    }
  }

  /**
   * BUYURTMA O'ZGARISHI — chiqarilgan materialga qayta-ishlov (EP-WMS-085 vizyon).
   *
   * Buyurtma boshqa texkartaga o'zgarsa, ALLAQACHON shu harakat ostida
   * chiqarilgan materiallar yangi texkartaga MOS kelmasligi mumkin. Bu metod
   * harakat qatorlarini YANGI texkartaga qayta-solishtiradi va mos kelmaganlarni
   * qaytaradi (chaqiruvchi menejer-ogohlantirish / qaytarish-akti yaratishi uchun).
   *
   * Hech narsa o'zgartirmaydi (read-only qayta-tekshiruv) — saqlangan
   * bog'lanish yangilanadi, lekin stock/harakatga TEGILMAYDI (regress YO'Q).
   */
  async recheckOnOrderChange(
    movementId: number,
    newTechnologyCardId: number,
  ): Promise<Result<TechCardGateResult>> {
    try {
      // Harakat qatorlarini (material + qavat-manbai yo'q → null) o'qiymiz.
      // pos_movement_lines.material_id = material_cards.id (chiqarilgan material).
      const lineRows = await typedExecute<{ material_id: number }>(sql`
        SELECT material_id
        FROM pos_movement_lines
        WHERE movement_id = ${movementId}
      `);
      const lines: TechCardGateLine[] = (Array.isArray(lineRows) ? lineRows : []).map((r) => ({
        materialCardId: Number(r.material_id),
        issuedLayer: null,
      }));

      if (lines.length === 0) {
        return Ok({ allowed: true, blocks: [] });
      }

      const checkR = await this.checkLines(newTechnologyCardId, lines);
      if (!checkR.ok) return Err(checkR.error);

      // Yangi texkarta bog'lanishini saqlaymiz (gate natijasi bilan).
      await this.recordLink(movementId, newTechnologyCardId, null, checkR.data);

      if (!checkR.data.allowed) {
        this.logger.warn(
          { movementId, newTechnologyCardId, blocks: checkR.data.blocks.length },
          'Buyurtma o\'zgardi — chiqarilgan material yangi texkartaga mos kelmadi',
        );
      }
      return Ok(checkR.data);
    } catch (e) {
      return Err(AppErr('INTERNAL', String(e)));
    }
  }
}
