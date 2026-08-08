/**
 * @module wms-in-transit.service
 * @description Import xom-ashyo YO'LDA kuzatuvi — application qatlam.
 *   Holat-mashinasi: shipped → customs → arrived (yoki cancelled). "Arrived"
 *   bo'lganda mavjud KARANTIN darvozasiga ulanadi: mm_goods_receipts ga DRAFT
 *   qabul ochiladi (keyin DRAFT → KARANTIN → QC → MAIN mavjud oqimi davom etadi),
 *   jo'natmaga goods_receipt_id biriktiriladi. Mavjud WMS yo'liga TEGMAYDI (Q-46
 *   additive). Result<T> qaytaradi; throw qilmaydi. service'da to'g'ridan db.* YO'Q
 *   (Qoida 15) — barchasi repo orqali.
 *   Owner interview 2026-07-13 (chat) item (4): "arrived" bosqichida haqiqiy GL
 *   yozuvi (Dr Materiallar / Cr Yo'lda tovar) GlPostingService orqali yoziladi —
 *   avval bu logistika-holat-mashinasi to'liq ishlagan, lekin buxgalteriya tomoni
 *   umuman yo'q edi (gl_entries/GlPosting chaqiruvi nol edi).
 * @layer Application (WMS)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  IWmsInTransitRepo,
  WMS_IN_TRANSIT_REPO,
  IN_TRANSIT_STATUS,
  IN_TRANSIT_TRANSITIONS,
} from '../domain/repositories/i-wms-in-transit.repo';
import { GlPostingService, type JournalLine } from '@modules/finance/domain/services/gl-posting.service';
import { GL } from '@modules/finance/domain/constants/gl-accounts.constants';

type Row = Record<string, unknown>;

@Injectable()
export class WmsInTransitService {
  private readonly logger = new Logger(WmsInTransitService.name);

  constructor(
    @Inject(WMS_IN_TRANSIT_REPO) private readonly repo: IWmsInTransitRepo,
    private readonly glPosting: GlPostingService,
  ) {}

  async list(status?: string): Promise<Result<Row[], AppError>> {
    return this.repo.listShipments(status);
  }

  async getOne(id: number): Promise<Result<Row, AppError>> {
    const r = await this.repo.findShipment(id);
    if (!r.ok) return r as Result<Row, AppError>;
    if (!r.data) return Err({ code: 'NOT_FOUND', message: `Jo'natma topilmadi: ${id}` });
    return Ok(r.data);
  }

  async create(body: Row, userId: number | null): Promise<Result<Row, AppError>> {
    return this.repo.createShipment(body, userId);
  }

  /** Holat-mashinasi tekshiruvi (shipped → customs → arrived). */
  private assertTransition(from: string | null, to: string): Result<true, AppError> {
    const allowed = IN_TRANSIT_TRANSITIONS[from ?? ''] ?? [];
    if (!Array.isArray(allowed) || !allowed.includes(to)) {
      return Err({
        code: 'BUSINESS_RULE_VIOLATION',
        message: `Noto'g'ri o'tish: '${from ?? 'NULL'}' → '${to}'`,
      });
    }
    return Ok(true);
  }

  /** shipped → customs (bojxonaga yetdi). */
  async markCustoms(id: number, userId: number | null, customsDate?: string | null): Promise<Result<Row, AppError>> {
    const cur = await this.repo.findShipment(id);
    if (!cur.ok) return cur as Result<Row, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Jo'natma topilmadi: ${id}` });

    const t = this.assertTransition(String(cur.data.status ?? ''), IN_TRANSIT_STATUS.CUSTOMS);
    if (!t.ok) return t as Result<Row, AppError>;

    this.logger.log(`[In-transit] Jo'natma ${id}: '${cur.data.status}' → customs`);
    void userId;
    return this.repo.updateStatus(id, IN_TRANSIT_STATUS.CUSTOMS, { customsDate: customsDate ?? null });
  }

  /**
   * customs → arrived: KARANTIN darvozasiga ulaydi.
   * Mavjud karantin oqimiga DRAFT qabul ochadi (mm_goods_receipts) va
   * jo'natmaga goods_receipt_id biriktiradi. Stok bu bosqichda MAIN ga
   * TUSHMAYDI — mavjud darvoza (QC_PASS shart) o'z kuchida qoladi (Q-46).
   */
  async markArrived(id: number, userId: number | null, arrivedDate?: string | null): Promise<Result<Row, AppError>> {
    const cur = await this.repo.findShipment(id);
    if (!cur.ok) return cur as Result<Row, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Jo'natma topilmadi: ${id}` });

    const t = this.assertTransition(String(cur.data.status ?? ''), IN_TRANSIT_STATUS.ARRIVED);
    if (!t.ok) return t as Result<Row, AppError>;

    // Mavjud karantin darvozasiga kirim oching (DRAFT qabul).
    const gr = await this.repo.createGoodsReceiptDraft(cur.data, userId);
    if (!gr.ok) return gr as Result<Row, AppError>;

    // Owner interview 2026-07-13 item (4): qiymat "Yo'lda tovar" (1020) hisobidan
    // "Materiallar" (1000) hisobiga ko'chadi — aynan shu arrival lahzasida, real
    // ikki-tomonlama GL yozuvi (mirrors wms-goods-issued.listener.ts's WMS→FIN
    // GlPostingService.postJournal chaqiruv uslubi). Faqat declared_value musbat
    // VA valyuta UZS/bo'sh bo'lganda post qilinadi — bu jadvalda kurs (exchange
    // rate) saqlanmaydi, shuning uchun chet-el valyutasi uchun raqamni o'ylab
    // topmaymiz (Q-40) — o'tkazib yuboriladi va log yoziladi, tranzitsiyani
    // bloklamaydi (best-effort, xuddi WmsGoodsIssuedListener/WmsFgReceivedGlListener
    // kabi — subledger/logistika manba-haqiqat, GL xatosi arrival'ni to'xtatmaydi).
    const declaredValue = Number(cur.data.declared_value);
    const currency = cur.data.currency == null ? null : String(cur.data.currency).trim().toUpperCase();
    if (Number.isFinite(declaredValue) && declaredValue > 0) {
      if (!currency || currency === 'UZS') {
        const lines: JournalLine[] = [
          { accountCode: GL.INVENTORY, accountName: 'Materiallar (Inventory) - Dr', debit: declaredValue, credit: 0 },
          { accountCode: GL.GOODS_IN_TRANSIT, accountName: "Yo'lda tovar - Cr", debit: 0, credit: declaredValue },
        ];
        const glR = await this.glPosting.postJournal(lines, `WIT-${id}`, userId ?? undefined);
        if (!glR.ok) {
          this.logger.warn(`[In-transit] Jo'natma ${id}: GL yozuvi muvaffaqiyatsiz (arrival) — ${glR.error.message}`);
        } else {
          this.logger.log(`[In-transit] Jo'natma ${id}: GL yozuvi yozildi (Yo'lda tovar → Materiallar), entryId=${glR.data}`);
        }
      } else {
        this.logger.warn(
          `[In-transit] Jo'natma ${id}: declared_value ${currency} valyutasida — bu jadvalda kurs yo'q, GL post o'tkazib yuborildi (Q-40)`,
        );
      }
    }

    this.logger.log(`[In-transit] Jo'natma ${id}: customs → arrived; karantin qabul #${gr.data.id} ochildi`);
    return this.repo.updateStatus(id, IN_TRANSIT_STATUS.ARRIVED, {
      arrivedDate: arrivedDate ?? null,
      goodsReceiptId: gr.data.id,
    });
  }

  /** Jo'natmani bekor qilish (shipped/customs holatidan). */
  async cancel(id: number): Promise<Result<Row, AppError>> {
    const cur = await this.repo.findShipment(id);
    if (!cur.ok) return cur as Result<Row, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Jo'natma topilmadi: ${id}` });

    const t = this.assertTransition(String(cur.data.status ?? ''), IN_TRANSIT_STATUS.CANCELLED);
    if (!t.ok) return t as Result<Row, AppError>;
    return this.repo.updateStatus(id, IN_TRANSIT_STATUS.CANCELLED);
  }

  async listDocuments(shipmentId: number): Promise<Result<Row[], AppError>> {
    return this.repo.listDocuments(shipmentId);
  }

  async addDocument(shipmentId: number, body: Row, userId: number | null): Promise<Result<Row, AppError>> {
    const cur = await this.repo.findShipment(shipmentId);
    if (!cur.ok) return cur as Result<Row, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Jo'natma topilmadi: ${shipmentId}` });
    return this.repo.addDocument(shipmentId, body, userId);
  }
}
