/**
 * @module pos-stock-issuable.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * BE-T2-BARCODE-RESERV — Ombor terminal spec (2026-06-27):
 *  (1) KIRIM BARKOD-GEN — generateInboundBarcode(): ombor-prefiks + ketma-ket seq
 *      bilan NOYOB barkod hosil qiladi, pos_barcode_print_queue ga 'QUEUED' yozadi
 *      (POS Monitor printeri "tug'iradi", ERP'dan EMAS) va etiket-data (o'lcham
 *      label-config'dan, ombor turiga moslashadi) qaytaradi.
 *  (2) CHIQIM BRON-BLOK — getIssuable(): skanlangan barkod → material + jami qoldiq +
 *      BRON (stock_reservations ACTIVE + AI-planning reserved_by_ai) → bo'sh qoldiq.
 *      bron > 0 → blocked flag (faqat super_admin/direktor override). Q-40: bron
 *      jadval bo'sh → 0 bron, hammasi bo'sh-qoldiq.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { Role } from '@common/constants/roles.constants';
import {
  PosStockIssuableRepository,
  type IssuableStockRow,
} from '../../infrastructure/repositories/pos-stock-issuable.repository';

/** Etiket o'lchami (mm) — ombor turi label_template'iga moslashadi (spec). */
export interface LabelDimensions {
  template: string;
  widthMm:  number;
  heightMm: number;
  dpi:      number;
}

/**
 * label_template → fizik o'lcham xaritasi. warehouse_types.label_template qiymatlari
 * (jonli DB): standard / finished / roll. Etiket o'lchami har ombor turiga moslashadi.
 * Noma'lum template → standard (graceful, Q-40 fabrikatsiya yo'q).
 */
export const LABEL_DIMENSIONS: Record<string, LabelDimensions> = {
  standard: { template: 'standard', widthMm: 58, heightMm: 40, dpi: 203 },
  finished: { template: 'finished', widthMm: 100, heightMm: 70, dpi: 203 },
  roll:     { template: 'roll',     widthMm: 80, heightMm: 50, dpi: 203 },
};

export interface InboundBarcodeResult {
  barcode:        string;
  queueId:        number;
  materialCardId: number;
  warehouseId:    number;
  label: {
    materialCode: string | null;
    materialName: string;
    unit:         string;
    quantity:     number | null;
    warehouseCode: string;
    barcodeType:  'CODE128';
    dimensions:   LabelDimensions;
  };
}

export interface IssuableResult {
  found:          boolean;
  barcode:        string;
  materialCardId?: number;
  materialCode?:  string | null;
  materialName?:  string;
  unit?:          string;
  warehouseId?:   number;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  onHand:         number;
  reserved:       number;
  freeStock:      number;
  /** Bron > 0 → CHIQIM blok (faqat override roli buzadi). */
  blocked:        boolean;
  /** Ushbu user blokni buza oladimi (super_admin / direktor). */
  canOverride:    boolean;
  reservations:   Array<{
    reservationId:   number;
    reservationNumber: string | null;
    reservedQuantity: number;
    reservedByAi:    boolean;
    orderId:         number | null;
    orderType:       string | null;
  }>;
}

@Injectable()
export class PosStockIssuableService {
  private readonly logger = new Logger(PosStockIssuableService.name);

  constructor(private readonly repo: PosStockIssuableRepository) {}

  // ─── KIRIM: barkod generatsiya ────────────────────────────────────────────

  /**
   * KIRIM uchun material'ga noyob barkod hosil qiladi (ombor-prefiks + seq + sana)
   * va pos_barcode_print_queue ga 'QUEUED' yozadi. Etiket o'lchami ombor turiga
   * moslashadi (label-config). Barkod POS Monitor printeridan chop etiladi.
   */
  async generateInboundBarcode(input: {
    materialCardId: number;
    warehouseId:    number;
    quantity?:      number;
    unit?:          string;
    requestedBy:    number;
  }): Promise<Result<InboundBarcodeResult, AppError>> {
    const cfgR = await this.repo.findWarehouseLabelConfig(input.warehouseId);
    if (!cfgR.ok) return Err(cfgR.error);
    if (!cfgR.data) return Err({ message: `Ombor topilmadi: ${input.warehouseId}`, code: 'NOT_FOUND' });
    const cfg = cfgR.data;

    const matR = await this.repo.findMaterialForLabel(input.materialCardId);
    if (!matR.ok) return Err(matR.error);
    if (!matR.data) return Err({ message: `Material topilmadi: ${input.materialCardId}`, code: 'NOT_FOUND' });
    const mat = matR.data;

    // Ombor-prefiks: warehouse.code dan toza segment (faqat A-Z0-9), maks 8 belgi.
    const prefixCore = (cfg.warehouseCode || `WH${input.warehouseId}`)
      .replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8) || `WH${input.warehouseId}`;
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `${prefixCore}-${datePart}-`;

    // Ketma-ket seq (shu ombor-prefiks + sana bo'yicha). Qarama-qarshilik bo'lsa
    // (poyga holati) — noyoblik tekshiruvi bilan keyingi raqamga suriladi.
    const barcode = await this._allocateUniqueBarcode(prefix);
    if (!barcode.ok) return Err(barcode.error);

    const unit = input.unit ?? mat.unit;
    const dimensions = LABEL_DIMENSIONS[cfg.labelTemplate ?? 'standard'] ?? LABEL_DIMENSIONS['standard'];

    const insR = await this.repo.insertGeneratedBarcode({
      materialCardId: input.materialCardId,
      warehouseId:    input.warehouseId,
      barcode:        barcode.data,
      quantity:       input.quantity ?? null,
      unit,
      templateName:   dimensions.template,
      requestedBy:    input.requestedBy,
    });
    if (!insR.ok) return Err(insR.error);

    this.logger.log(`[KIRIM-barkod] ${barcode.data} → material ${input.materialCardId} @ ombor ${cfg.warehouseCode} (queue #${insR.data.id})`);

    return Ok({
      barcode:        barcode.data,
      queueId:        insR.data.id,
      materialCardId: input.materialCardId,
      warehouseId:    input.warehouseId,
      label: {
        materialCode: mat.kod,
        materialName: mat.name,
        unit,
        quantity:     input.quantity ?? null,
        warehouseCode: cfg.warehouseCode,
        barcodeType:  'CODE128',
        dimensions,
      },
    });
  }

  /** Noyob barkod ajratish — seq oladi, mavjud bo'lsa keyingisiga o'tadi (maks 20 urinish). */
  private async _allocateUniqueBarcode(prefix: string): Promise<Result<string, AppError>> {
    const seqR = await this.repo.nextSequenceForPrefix(prefix);
    if (!seqR.ok) return Err(seqR.error);
    let seq = seqR.data;
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = `${prefix}${String(seq).padStart(5, '0')}`;
      const existsR = await this.repo.barcodeExists(candidate);
      if (!existsR.ok) return Err(existsR.error);
      if (!existsR.data) return Ok(candidate);
      seq++;
    }
    return Err({ message: 'Noyob barkod ajratib bo\'lmadi (20 urinish)', code: 'CONFLICT' });
  }

  // ─── CHIQIM: barkod → bo'sh qoldiq + bron-blok ────────────────────────────

  /**
   * Skanlangan barkod → material + jami qoldiq + bron → bo'sh qoldiq.
   * bron > 0 → blocked (faqat bo'sh-qoldiq beriladi; override roli buzadi).
   * userRole — override (super_admin/direktor) huquqini aniqlash uchun.
   */
  async getIssuable(barcode: string, userRole: Role, warehouseId?: number): Promise<Result<IssuableResult, AppError>> {
    const canOverride = userRole === Role.SUPER_ADMIN || userRole === Role.DIRECTOR;

    const rowR = await this.repo.findIssuableByBarcode(barcode, warehouseId);
    if (!rowR.ok) return Err(rowR.error);
    const row: IssuableStockRow | null = rowR.data;

    if (!row) {
      return Ok({
        found: false, barcode,
        onHand: 0, reserved: 0, freeStock: 0,
        blocked: false, canOverride, reservations: [],
      });
    }

    // Bron — material topilgan ombor uchun (qoldiq topilmagan bo'lsa bron ham 0).
    let reservedTotal = 0;
    let reservations: IssuableResult['reservations'] = [];
    if (row.warehouseId) {
      const resR = await this.repo.findActiveReservations(row.materialCardId, row.warehouseId);
      if (!resR.ok) return Err(resR.error);
      // Q-40: jadval bo'sh → bo'sh massiv → 0 bron, hammasi bo'sh-qoldiq.
      reservedTotal = resR.data.reduce((s, r) => s + Number(r.reservedQuantity ?? 0), 0);
      reservations = resR.data.map((r) => ({
        reservationId:   r.reservationId,
        reservationNumber: r.reservationNumber,
        reservedQuantity: Number(r.reservedQuantity ?? 0),
        reservedByAi:    Boolean(r.reservedByAi),
        orderId:         r.orderId,
        orderType:       r.orderType,
      }));
    }

    const onHand = Number(row.onHand ?? 0);
    // warehouse_stock.available_quantity bron'larni allaqachon ayirgan bo'lishi mumkin;
    // bo'sh-qoldiq = max(available, onHand - reserved) — ikkala manbani izchillashtiramiz.
    const availableCol = Number(row.available ?? 0);
    const freeStock = Math.max(0, Math.min(availableCol > 0 ? availableCol : onHand, onHand - reservedTotal));
    const blocked = reservedTotal > 0;

    return Ok({
      found: true,
      barcode,
      materialCardId: row.materialCardId,
      materialCode:   row.kod,
      materialName:   row.name,
      unit:           row.unit,
      warehouseId:    row.warehouseId ?? undefined,
      warehouseCode:  row.warehouseCode,
      warehouseName:  row.warehouseName,
      onHand,
      reserved:       reservedTotal,
      freeStock,
      blocked,
      canOverride,
      reservations,
    });
  }
}
