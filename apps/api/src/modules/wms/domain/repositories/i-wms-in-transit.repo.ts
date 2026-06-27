/**
 * @module i-wms-in-transit.repo
 * @description Import xom-ashyo YO'LDA kuzatuvi uchun domen repository interfeysi.
 *   Jadvallar: `wms_in_transit_shipments` (jo'natma holat-mashinasi) +
 *   `wms_import_documents` (GTD/invoys/sertifikat). "Arrived" bo'lganda
 *   mavjud karantin darvozasi (mm_goods_receipts DRAFT) bilan ulanadi.
 *   Konkret implementatsiya:
 *   `infrastructure/repositories/wms-in-transit.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

/** In-transit jo'natma holatlari (DB CHECK bilan mos). */
export const IN_TRANSIT_STATUS = {
  SHIPPED: 'shipped',
  CUSTOMS: 'customs',
  ARRIVED: 'arrived',
  CANCELLED: 'cancelled',
} as const;

export type InTransitStatus =
  (typeof IN_TRANSIT_STATUS)[keyof typeof IN_TRANSIT_STATUS];

/** Holat-mashinasi: keyingi ruxsat etilgan o'tishlar. */
export const IN_TRANSIT_TRANSITIONS: Record<string, string[]> = {
  [IN_TRANSIT_STATUS.SHIPPED]: [IN_TRANSIT_STATUS.CUSTOMS, IN_TRANSIT_STATUS.CANCELLED],
  [IN_TRANSIT_STATUS.CUSTOMS]: [IN_TRANSIT_STATUS.ARRIVED, IN_TRANSIT_STATUS.CANCELLED],
  [IN_TRANSIT_STATUS.ARRIVED]: [],
  [IN_TRANSIT_STATUS.CANCELLED]: [],
};

export interface IWmsInTransitRepo {
  /** Jo'natmalar ro'yxati (ixtiyoriy status filtri). */
  listShipments(status?: string): Promise<Result<Row[]>>;
  /** Bitta jo'natma (hujjatlari bilan birga emas — alohida o'qiladi). */
  findShipment(id: number): Promise<Result<Row | null>>;
  /** Yangi import jo'natmasi (status='shipped'). */
  createShipment(body: Row, userId: number | null): Promise<Result<Row>>;
  /** Faqat holatni yangilaydi (holat-mashinasi service'da tekshiriladi). */
  updateStatus(
    id: number,
    status: string,
    patch?: { customsDate?: string | null; arrivedDate?: string | null; goodsReceiptId?: number | null },
  ): Promise<Result<Row>>;
  /**
   * "Arrived" bo'lganda mavjud karantin darvozasiga kirim ochadi:
   * mm_goods_receipts ga DRAFT qabul yozadi va id qaytaradi. Keyin
   * mavjud karantin oqimi (DRAFT → KARANTIN → QC → MAIN) davom etadi.
   */
  createGoodsReceiptDraft(shipment: Row, userId: number | null): Promise<Result<{ id: number }>>;
  /** Jo'natmaning hujjatlari (GTD/invoys/sertifikat). */
  listDocuments(shipmentId: number): Promise<Result<Row[]>>;
  /** Jo'natmaga hujjat biriktiradi. */
  addDocument(shipmentId: number, body: Row, userId: number | null): Promise<Result<Row>>;
}

export const WMS_IN_TRANSIT_REPO = Symbol('WMS_IN_TRANSIT_REPO');
