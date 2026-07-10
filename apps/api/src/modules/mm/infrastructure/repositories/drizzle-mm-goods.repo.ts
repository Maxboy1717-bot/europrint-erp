/**
 * @module drizzle-mm-goods.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import {
  queryGoodsReceipts, queryGoodsReceipt, execCreateGoodsReceipt, execInsertGoodsReceiptItem,
  execCountReceiptItemsMissingLocation, execAssignReceiptItemLocation,
  execUpdateGoodsReceipt, execDeleteGoodsReceipt, execPostGoodsReceiptStock,
  queryGoodsIssues, queryGoodsIssue, execCreateGoodsIssue, execInsertGoodsIssueItem,
  execUpdateGoodsIssue, execDeleteGoodsIssue,
  queryThreeWayMatch, queryCurrencies, queryPriceComparison,
} from '@common/database/queries-mm-goods';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleMmGoodsRepository {
  async listGoodsReceipts(pid: number | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
    return queryGoodsReceipts(pid, status, lim, off);
  }

  async getGoodsReceipt(gid: number): Promise<{ receipt: Row | null; items: Row[] }> {
    return queryGoodsReceipt(gid);
  }

  async createGoodsReceipt(purchase_order_id: unknown, received_by: unknown, notes: unknown, delivery_note: unknown, warehouse_id?: unknown): Promise<Row> {
    return execCreateGoodsReceipt(purchase_order_id, received_by, notes, delivery_note, warehouse_id);
  }

  async insertGoodsReceiptItem(receiptId: unknown, material_id: unknown, ordered_qty: unknown, received_qty: unknown, batch_number: unknown, zone_id?: unknown, bin_location_id?: unknown): Promise<void> {
    return execInsertGoodsReceiptItem(receiptId, material_id, ordered_qty, received_qty, batch_number, undefined, zone_id, bin_location_id);
  }

  /** vision 10-wms#5: how many lines of this receipt still lack a zone (address). >0 blocks confirm. */
  async countReceiptItemsMissingLocation(gid: number): Promise<number> {
    return execCountReceiptItemsMissingLocation(gid);
  }

  /** vision 10-wms#5: assign a real zone (+optional bin) to a draft receipt line; null when item/zone/bin invalid. */
  async assignReceiptItemLocation(itemId: number, zoneId: number, binLocationId: number | null): Promise<Record<string, unknown> | null> {
    return execAssignReceiptItemLocation(itemId, zoneId, binLocationId);
  }

  /**
   * #09 xarid->kirim: post the receipt's received quantities into canonical warehouse_stock, then mark
   * it 'received'. Idempotent — a receipt already 'received' is not posted again (no double stock).
   */
  async postGoodsReceipt(gid: number): Promise<{ posted: boolean; lines: number; status: string }> {
    const { receipt } = await queryGoodsReceipt(gid);
    if (!receipt) return { posted: false, lines: 0, status: 'not_found' };
    if (String(receipt.status ?? '') === 'received') return { posted: false, lines: 0, status: 'already_received' };
    const lines = await execPostGoodsReceiptStock(gid);
    await execUpdateGoodsReceipt(gid, 'received', null);
    return { posted: true, lines, status: 'received' };
  }

  async updateGoodsReceipt(gid: number, status: unknown, notes: unknown): Promise<Row[]> {
    return execUpdateGoodsReceipt(gid, status, notes);
  }

  async deleteGoodsReceipt(gid: number): Promise<void> {
    return execDeleteGoodsReceipt(gid);
  }

  async listGoodsIssues(status: string | undefined, lim: number, off: number): Promise<Row[]> {
    return queryGoodsIssues(status, lim, off);
  }

  async getGoodsIssue(gid: number): Promise<{ issue: Row | null; items: Row[] }> {
    return queryGoodsIssue(gid);
  }

  async createGoodsIssue(issued_by: unknown, cost_center: unknown, work_order_id: unknown, notes: unknown, warehouse_id?: unknown): Promise<Row> {
    return execCreateGoodsIssue(issued_by, cost_center, work_order_id, notes, warehouse_id);
  }

  async insertGoodsIssueItem(issueId: unknown, material_id: unknown, quantity: unknown, batch_number: unknown): Promise<void> {
    return execInsertGoodsIssueItem(issueId, material_id, quantity, batch_number);
  }

  async updateGoodsIssue(gid: number, status: unknown, notes: unknown): Promise<Row[]> {
    return execUpdateGoodsIssue(gid, status, notes);
  }

  async deleteGoodsIssue(gid: number): Promise<void> {
    return execDeleteGoodsIssue(gid);
  }

  async threeWayMatch(pid: number): Promise<{
    purchase_order: unknown; goods_receipts: Row[]; purchase_invoices: Row[];
    match: { matched: boolean; difference: number; tolerance_pct: number; po_total: number; goods_receipt_total: number; invoice_total: number; documents_present: boolean } | null;
  }> {
    return queryThreeWayMatch(pid);
  }

  async getCurrencies(): Promise<Row[]> {
    return queryCurrencies();
  }

  async getPriceComparison(mid: number | null): Promise<Row[]> {
    return queryPriceComparison(mid);
  }
}
