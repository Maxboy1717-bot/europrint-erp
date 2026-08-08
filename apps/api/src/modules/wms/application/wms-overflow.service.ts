/**
 * @module wms-overflow.service
 * @description Hom-ashyo ombori chiqim "overflow" (idish-yaxlitlash) mantig'i.
 *
 * Vizyon manba (AYNAN, o'ylab topilmagan):
 *   docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md §2 (22-24 savol):
 *   "CHIQIM (overflow mantiq): 3 kg kraska kerak, lekin idish 5 kg → 5 kg beriladi →
 *    bo'lim ichki omboriga +2 kg o'tadi; hom-ashyo ombori -2 belgilaydi (keyingi safar
 *    kam berish uchun); bo'lim o'sha 2 kg'ni biror buyurtmaga ishlatsa → AI ikkala
 *    ombordan ham o'sha buyurtmaga rasxod qiladi."
 *   §A5 (130-satr): "har bo'limning o'z ichki ombori bor (DEPARTMENT_* tip) — overflow (+2kg)".
 *
 * Mantiq (idish-yaxlitlash overflow):
 *   - requestedAmount  = ishlab chiqarish/bo'lim talab qilgan miqdor (masalan 3 kg).
 *   - issuedAmount     = idish/tara tufayli jismonan berilgan miqdor (masalan 5 kg).
 *   - overflow         = issuedAmount − requestedAmount (masalan 2 kg). Manfiy bo'lolmaydi.
 *   - Hom-ashyo (manba) ombordan TO'LIQ issuedAmount kamayadi (5 kg jismonan chiqdi).
 *   - Overflow (2 kg) bo'lim ichki ombori (DEPARTMENT_* tip) warehouse_stock ga +qo'shiladi —
 *     bu yerda "qoldiq" sifatida nazoratda turadi, keyin buyurtmaga ishlatiladi.
 *   - Hammasi BITTA tranzaksiyada: manba -issuedAmount, bo'lim +overflow, chiqim yozuvi.
 *
 * "-2 belgilaydi": hom-ashyo ombori jismonan -issuedAmount kamayadi (5), lekin buyurtma
 *   faqat requestedAmount (3) ni rasxod qiladi; ortiqcha 2 bo'lim omborida ko'rinadi.
 *   Bu yondashuv qoldiqni YO'QOTMAYDI (ikkala ombor yig'indisi to'g'ri qoladi).
 *
 * DOIRA: bu servis FAQAT hujjatlashtirilgan idish-overflow ni amalga oshiradi.
 *   "Asosiy ombor sig'imi to'lganda DEPARTMENT ga avto-ko'chirish" qoidasi (sig'im chegarasi
 *   + trigger) hujjatda YO'Q — egasi spetsifikatsiyasi kerak (P21 §2.9-B). Bu yerda
 *   o'ylab topilmaydi.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import {
  IWmsRepository,
  WMS_REPO,
  DrizzleExecutor,
} from '../domain/repositories/wms.repository';

/** Raw-SQL bajaruvchi yuzasi (db yoki tx) — repo bilan bir uslub. */
type ExecuteLike = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> };

export interface OverflowIssueParams {
  /** Manba (hom-ashyo) ombori — jismonan issuedAmount kamayadi. */
  sourceWarehouseId: number;
  /** Bo'lim ichki ombori (DEPARTMENT_* tip) — overflow +qo'shiladi. */
  deptWarehouseId: number;
  materialId: number;
  /** Talab qilingan (buyurtma) miqdor — masalan 3 kg. */
  requestedAmount: number;
  /** Jismonan berilgan (idish) miqdor — masalan 5 kg. issuedAmount >= requestedAmount. */
  issuedAmount: number;
  /** Buyurtma (production_orders.id) — chiqim yozuviga bog'lanadi (nullable). */
  ppId: number | null;
  issuedBy: number | null;
}

export interface OverflowIssueResult {
  sourceWarehouseId: number;
  deptWarehouseId: number;
  materialId: number;
  requestedAmount: number;
  issuedAmount: number;
  /** Bo'lim omboriga o'tgan ortiqcha (issued − requested). */
  overflowAmount: number;
  goodsIssueId: number;
}

@Injectable()
export class WmsOverflowService {
  private readonly logger = new Logger(WmsOverflowService.name);

  constructor(@Inject(WMS_REPO) private readonly wmsRepo: IWmsRepository) {}

  /**
   * Idish-overflow chiqim: manba ombordan issuedAmount kamaytiriladi, ortiqchasi
   * (issued − requested) bo'lim ichki omboriga o'tkaziladi — bitta tranzaksiyada.
   */
  async issueWithOverflow(params: OverflowIssueParams): Promise<Result<OverflowIssueResult>> {
    const {
      sourceWarehouseId,
      deptWarehouseId,
      materialId,
      requestedAmount,
      issuedAmount,
      ppId,
      issuedBy,
    } = params;

    if (issuedAmount < requestedAmount) {
      return Err(
        AppErr(
          'INVALID_QUANTITY',
          `Berilgan miqdor (${issuedAmount}) talab qilingandan (${requestedAmount}) kam bo'lolmaydi`,
        ),
      );
    }
    if (sourceWarehouseId === deptWarehouseId) {
      return Err(AppErr('SAME_WAREHOUSE', 'Manba va bo\'lim ombori bir xil bo\'lolmaydi'));
    }

    const overflowAmount = Number((issuedAmount - requestedAmount).toFixed(4));

    return this.wmsRepo.withTransaction(async (tx) => {
      const exec = tx as unknown as ExecuteLike;

      // 1. Manba (hom-ashyo) ombordan jismonan issuedAmount kamaytirish (guarded — manfiy bo'lmaydi).
      const decRows = await exec.execute(sql`
        UPDATE warehouse_stock
        SET quantity = quantity - ${issuedAmount},
            available_quantity = available_quantity - ${issuedAmount},
            last_movement_at = NOW(), last_updated_at = NOW()
        WHERE warehouse_id = ${sourceWarehouseId} AND material_id = ${materialId}
          AND available_quantity >= ${issuedAmount}
        RETURNING id
      `);
      const decId = Number((decRows.rows?.[0] as { id?: unknown } | undefined)?.id ?? 0);
      if (decId === 0) {
        return Err(
          AppErr(
            'INVALID_QUANTITY',
            `Manba omborda (id=${sourceWarehouseId}) yetarli qoldiq yo'q yoki material topilmadi (kerak ${issuedAmount})`,
          ),
        );
      }

      // 2. Overflow (ortiqcha) bo'lim ichki omboriga +qo'shish (idempotent upsert — receiveFg uslubi).
      if (overflowAmount > 0) {
        await exec.execute(sql`
          INSERT INTO warehouse_stock
            (warehouse_id, material_id, quantity, reserved_quantity, available_quantity,
             last_updated_at, created_at, last_movement_at)
          VALUES
            (${deptWarehouseId}, ${materialId}, ${overflowAmount}, 0, ${overflowAmount},
             NOW(), NOW(), NOW())
          ON CONFLICT (warehouse_id, material_id)
          DO UPDATE SET
            quantity           = warehouse_stock.quantity + ${overflowAmount},
            available_quantity = warehouse_stock.available_quantity + ${overflowAmount},
            last_movement_at   = NOW(),
            last_updated_at    = NOW()
        `);
      }

      // 3. Chiqim yozuvi (wms_goods_issues) — manba ombordan to'liq issuedAmount chiqdi.
      //    notes ichida overflow nazorat izi (qaysi bo'limga qancha o'tdi).
      const note = overflowAmount > 0
        ? `OVERFLOW: talab=${requestedAmount}, berilgan=${issuedAmount}, ortiqcha=${overflowAmount} → bo'lim ombori id=${deptWarehouseId}`
        : `Talab=${requestedAmount}, berilgan=${issuedAmount} (ortiqcha yo'q)`;

      const insRows = await exec.execute(sql`
        INSERT INTO wms_goods_issues
          (material_id, warehouse_id, quantity, pp_id, status, issued_by, notes)
        VALUES
          (${materialId}, ${sourceWarehouseId}, ${String(issuedAmount)}, ${ppId ?? null},
           'issued', ${issuedBy ?? null}, ${note})
        RETURNING id
      `);
      const goodsIssueId = Number((insRows.rows?.[0] as { id?: unknown } | undefined)?.id ?? 0);
      if (goodsIssueId === 0) {
        return Err(AppErr('DB_ERROR', 'Chiqim yozuvi saqlanmadi'));
      }

      this.logger.log(
        {
          code: 'EP-WMS-OVERFLOW',
          sourceWarehouseId,
          deptWarehouseId,
          materialId,
          requestedAmount,
          issuedAmount,
          overflowAmount,
          goodsIssueId,
        },
        'Overflow chiqim qo\'llandi',
      );

      return Ok({
        sourceWarehouseId,
        deptWarehouseId,
        materialId,
        requestedAmount,
        issuedAmount,
        overflowAmount,
        goodsIssueId,
      });
    });
  }
}

/** Re-export DrizzleExecutor turini (servis tashqarisidagi tip-import qulayligi uchun). */
export type { DrizzleExecutor };
