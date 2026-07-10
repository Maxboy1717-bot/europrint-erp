/**
 * @module mm-goods.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError } from '@common/result';
import { DrizzleMmGoodsRepository } from '../infrastructure/repositories/drizzle-mm-goods.repo';

@Injectable()
export class MmGoodsService {
  constructor(
    private readonly repo: DrizzleMmGoodsRepository,
    private readonly i18n: I18nService,
  ) {}

  async listGoodsReceipts(pid: number | null, status: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => this.repo.listGoodsReceipts(pid, status, lim, off));
  }

  async getGoodsReceipt(gid: number) {
    const notFoundMsg = await this.i18n.t('errors.notFound');
    return safeCall(async () => {
      const { receipt, items } = await this.repo.getGoodsReceipt(gid);
      if (!receipt) throw new NotFoundException(notFoundMsg);
      return { ...receipt, items };
    });
  }

  async createGoodsReceipt(purchase_order_id: unknown, received_by: unknown, items: Array<Record<string, unknown>>, notes: unknown, delivery_note: unknown, warehouse_id?: unknown) {
    return safeCall(async () => {
      const receipt = await this.repo.createGoodsReceipt(purchase_order_id, received_by, notes, delivery_note, warehouse_id);
      // Pattern 2: line-item inserts are independent — run in parallel rather than serial N+1.
      // The DTO sends `quantity`; map it to received_qty/ordered_qty (was always 0 — received_qty key never sent).
      await Promise.all(items.map(item => {
        const qty = item.received_qty ?? item.quantity ?? 0;
        return this.repo.insertGoodsReceiptItem(receipt.id, item.material_id, item.ordered_qty ?? qty, qty, item.batch_number, item.zone_id ?? null, item.bin_location_id ?? null);
      }));
      return receipt;
    });
  }

  /**
   * #09 xarid->kirim: post received quantities into canonical warehouse_stock + mark receipt received.
   * vision 10-wms#5 confirm-gate: a receipt with any location-less line (zone_id IS NULL) cannot be
   * posted/confirmed — it stays DRAFT until the warehouse worker assigns at least a zone-level location.
   */
  async postGoodsReceipt(gid: number) {
    return safeCall(async () => {
      const missingLocation = await this.repo.countReceiptItemsMissingLocation(gid);
      if (missingLocation > 0) {
        throw new ConflictException(
          `Manzilsiz kirim akti tasdiqlanmaydi: ${missingLocation} qatorda joylashuv (zona) ko'rsatilmagan — omborchi kamida zona darajasida manzil kiritishi shart.`,
        );
      }
      return this.repo.postGoodsReceipt(gid);
    });
  }

  async updateGoodsReceipt(gid: number, status: unknown, notes: unknown) {
    return safeCall(async () => this.repo.updateGoodsReceipt(gid, status, notes));
  }

  async deleteGoodsReceipt(gid: number) {
    return safeCall(async () => this.repo.deleteGoodsReceipt(gid));
  }

  /**
   * vision 10-wms#5: assign a real warehouse location (zone + optional bin) to a draft receipt line so
   * the receipt can later be confirmed. Freeform is rejected at the repo/DB layer (FK/EXISTS): an item
   * that is missing or a zone/bin that does not exist yields null -> NOT_FOUND.
   */
  async assignReceiptItemLocation(itemId: number, zone_id: number, bin_location_id: number | null) {
    return safeCall(async () => {
      const row = await this.repo.assignReceiptItemLocation(itemId, zone_id, bin_location_id);
      if (!row) throw new NotFoundException("Kirim qatori topilmadi yoki ko'rsatilgan zona/yacheyka mavjud emas.");
      return row;
    });
  }

  async listGoodsIssues(status: string | undefined, lim: number, off: number) {
    return safeCall(async () => this.repo.listGoodsIssues(status, lim, off));
  }

  async getGoodsIssue(gid: number) {
    const notFoundMsg = await this.i18n.t('errors.notFound');
    return safeCall(async () => {
      const { issue, items } = await this.repo.getGoodsIssue(gid);
      if (!issue) throw new NotFoundException(notFoundMsg);
      return { ...issue, items };
    });
  }

  async createGoodsIssue(issued_by: unknown, cost_center: unknown, work_order_id: unknown, items: Array<Record<string, unknown>>, notes: unknown, warehouse_id?: unknown) {
    return safeCall(async () => {
      const issue = await this.repo.createGoodsIssue(issued_by, cost_center, work_order_id, notes, warehouse_id);
      // Pattern 2: line-item inserts are independent — run in parallel rather than serial N+1
      await Promise.all(items.map(item =>
        this.repo.insertGoodsIssueItem(issue.id, item.material_id, item.quantity, item.batch_number),
      ));
      return issue;
    });
  }

  async updateGoodsIssue(gid: number, status: unknown, notes: unknown) {
    return safeCall(async () => this.repo.updateGoodsIssue(gid, status, notes));
  }

  async deleteGoodsIssue(gid: number) {
    return safeCall(async () => this.repo.deleteGoodsIssue(gid));
  }

  async threeWayMatch(pid: number) {
    return safeCall(async () => this.repo.threeWayMatch(pid));
  }

  async getCurrencies() {
    return safeCall(async () => this.repo.getCurrencies());
  }

  async getPriceComparison(mid: number | null) {
    return safeCall(async () => this.repo.getPriceComparison(mid));
  }
}
