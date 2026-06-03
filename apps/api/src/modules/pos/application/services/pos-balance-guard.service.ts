/**
 * POS — Balance Guard Service
 *
 * Harakat qatorlari qayta ishlanishidan OLDIN ombor qoldiqlarini tekshiradi.
 *
 * Qoidalar:
 *  - ASSET    (material_type = 'asset'):      Qattiq bloklash — available_qty < required_qty bo'lsa BadRequestException
 *  - CONSUMABLE (material_type = 'consumable'): Yumshoq bloklash — ogohlantirish qaytariladi, menejer override qila oladi
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

interface StockBalanceRow {
  available_qty:  string | null;
  material_type:  string | null;
}

interface CheckLineResult {
  allowed:        boolean;
  warning?:       string;
  remainingAfter: number;
}

interface MovementLineInput {
  warehouseId:    string;
  materialCardId: number;
  quantity:       number;
}

interface CheckMovementLinesResult {
  ok:       boolean;
  blocks:   string[];
  warnings: string[];
}

@Injectable()
export class PosBalanceGuardService {
  private readonly logger = new Logger(PosBalanceGuardService.name);

  /**
   * Bitta material qatori uchun qoldiqni tekshiradi.
   */
  async checkLine(
    warehouseId:    string,
    materialCardId: number,
    quantity:       number,
    materialType:   'asset' | 'consumable',
  ): Promise<CheckLineResult> {
    // Promise.resolve() wrap guards against `runQuery` stubs that return undefined
    // (e.g. in unit tests where mocks aren't queued) — without it, `.catch` throws TypeError.
    let dbErrored = false;
    const r = await Promise.resolve(runQuery<StockBalanceRow>(sql`
      SELECT
        COALESCE(ws.available_quantity, 0)::text AS available_qty,
        COALESCE(mc.material_type, 'consumable') AS material_type
      FROM warehouse_stock ws
      JOIN material_cards mc ON mc.id = ws.material_id
      WHERE ws.warehouse_id = ${warehouseId}
        AND ws.material_id  = ${materialCardId}
      LIMIT 1
    `)).catch((err: unknown) => {
      this.logger.error(`[BALANCE-GUARD] DB xato (matId=${materialCardId}): ${(err as Error).message}`);
      // Fail-CLOSED: flag the error so the guard below blocks the line.
      dbErrored = true;
      return { rows: [] as StockBalanceRow[] };
    });

    // Fail-CLOSED: a failed balance query means stock cannot be verified, so block
    // the line (asset AND consumable). A DB outage must never let an unchecked
    // movement through and risk a negative balance.
    if (dbErrored) {
      return {
        allowed:        false,
        warning:        `Material #${materialCardId} (${warehouseId}): balans tekshiruvi ishlamayapti (DB xato) - xavfsizlik uchun bloklandi`,
        remainingAfter: 0,
      };
    }

    const row            = r?.rows?.[0];
    const availableQty   = Number(row?.available_qty ?? 0);
    const remainingAfter = availableQty - quantity;
    const effectiveType  = (row?.material_type ?? materialType) as string;

    if (availableQty >= quantity) {
      return { allowed: true, remainingAfter };
    }

    const shortage = quantity - availableQty;

    if (effectiveType === 'asset') {
      // Qattiq bloklash
      return {
        allowed:        false,
        warning:        `Material #${materialCardId} (${warehouseId}): yetarli qoldiq yo'q. ` +
                        `Kerak: ${quantity}, mavjud: ${availableQty}, taqchil: ${shortage}`,
        remainingAfter,
      };
    }

    // Consumable — yumshoq bloklash (ogohlantirish)
    return {
      allowed:        true,
      warning:        `Material #${materialCardId} (${warehouseId}): qoldiq yetarli emas. ` +
                      `Kerak: ${quantity}, mavjud: ${availableQty}, taqchil: ${shortage}. ` +
                      `Menejer tasdig'i bilan davom etish mumkin.`,
      remainingAfter,
    };
  }

  /**
   * Harakat qatorlari uchun to'liq tekshiruv.
   *
   * @param lines          - Tekshiriladigan qatorlar
   * @param overrideReason - Menejer override sababi (consumable uchun)
   * @returns              - { ok, blocks, warnings }
   */
  async checkMovementLines(
    lines:          MovementLineInput[],
    overrideReason?: string,
  ): Promise<CheckMovementLinesResult> {
    const blocks:   string[] = [];
    const warnings: string[] = [];

    for (const line of lines) {
      // material_type ni DB dan olamiz (checkLine ichida)
      // Avval DB dan real material_type ni olamiz
      const typeRow = await Promise.resolve(runQuery<{ material_type: string | null }>(sql`
        SELECT COALESCE(material_type, 'consumable') AS material_type
        FROM material_cards
        WHERE id = ${line.materialCardId}
        LIMIT 1
      `)).catch(() => ({ rows: [{ material_type: 'consumable' as string | null }] }));

      const matType = (typeRow?.rows?.[0]?.material_type ?? 'consumable') as 'asset' | 'consumable';

      const result = await this.checkLine(
        line.warehouseId,
        line.materialCardId,
        line.quantity,
        matType,
      );

      if (!result.allowed) {
        // asset — qattiq bloklash
        blocks.push(result.warning ?? `Material #${line.materialCardId}: yetarli qoldiq yo'q`);
      } else if (result.warning) {
        // consumable — yumshoq ogohlantirish
        if (!overrideReason) {
          warnings.push(result.warning);
        } else {
          // Override bilan davom etish — faqat loglash
          this.logger.warn(
            `[BALANCE-GUARD] Override qo'llanildi: mat=${line.materialCardId} ` +
            `wh=${line.warehouseId} qty=${line.quantity} sabab="${overrideReason}"`,
          );
        }
      }
    }

    return {
      ok:       blocks.length === 0 && warnings.length === 0,
      blocks,
      warnings,
    };
  }
}
