/**
 * @module mm-goods.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { DrizzleMmGoodsRepository } from '../infrastructure/repositories/drizzle-mm-goods.repo';

@Injectable()
export class MmGoodsService {
  constructor(private readonly repo: DrizzleMmGoodsRepository) {}

  async listGoodsReceipts(pid: number | null, status: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => this.repo.listGoodsReceipts(pid, status, lim, off));
  }

  async getGoodsReceipt(gid: number) {
    return safeCall(async () => {
      const { receipt, items } = await this.repo.getGoodsReceipt(gid);
      if (!receipt) throw new NotFoundException(`Qabul #${gid} topilmadi`);
      return { ...receipt, items };
    });
  }

  async createGoodsReceipt(purchase_order_id: unknown, received_by: unknown, items: Array<Record<string, unknown>>, notes: unknown, delivery_note: unknown) {
    return safeCall(async () => {
      const receipt = await this.repo.createGoodsReceipt(purchase_order_id, received_by, notes, delivery_note);
      // Pattern 2: line-item inserts are independent — run in parallel rather than serial N+1
      await Promise.all(items.map(item =>
        this.repo.insertGoodsReceiptItem(receipt.id, item.material_id, item.ordered_qty, item.received_qty, item.batch_number),
      ));
      return receipt;
    });
  }

  async updateGoodsReceipt(gid: number, status: unknown, notes: unknown) {
    return safeCall(async () => this.repo.updateGoodsReceipt(gid, status, notes));
  }

  async deleteGoodsReceipt(gid: number) {
    return safeCall(async () => this.repo.deleteGoodsReceipt(gid));
  }

  async listGoodsIssues(status: string | undefined, lim: number, off: number) {
    return safeCall(async () => this.repo.listGoodsIssues(status, lim, off));
  }

  async getGoodsIssue(gid: number) {
    return safeCall(async () => {
      const { issue, items } = await this.repo.getGoodsIssue(gid);
      if (!issue) throw new NotFoundException(`Berilish #${gid} topilmadi`);
      return { ...issue, items };
    });
  }

  async createGoodsIssue(issued_by: unknown, cost_center: unknown, work_order_id: unknown, items: Array<Record<string, unknown>>, notes: unknown) {
    return safeCall(async () => {
      const issue = await this.repo.createGoodsIssue(issued_by, cost_center, work_order_id, notes);
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
