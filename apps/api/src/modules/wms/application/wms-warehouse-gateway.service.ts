/**
 * @module wms-warehouse-gateway.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { WmsWarehouseGatewayRepo } from '../infrastructure/wms-warehouse-gateway.repo';
import { WmsQuarantineGateService } from './wms-quarantine-gate.service';
import type { ReceiptStatusRow } from '../domain/repositories/i-wms-quarantine.repo';

type GatewayResult<T> = Promise<Result<T, AppError>>;

@Injectable()
export class WmsWarehouseGatewayService {
  constructor(
    private readonly repo: WmsWarehouseGatewayRepo,
    private readonly quarantineGate: WmsQuarantineGateService,
  ) {}

  async getDashboardKpis() {
    return this.repo.getDashboardKpis();
  }

  async getWarehouseOccupancy() {
    return this.repo.getWarehouseOccupancy();
  }

  async getWarehouses() {
    return this.repo.getWarehouses();
  }

  async getStock(warehouseId?: number, materialId?: number) {
    return this.repo.getStock(warehouseId, materialId);
  }

  async getLots(materialId?: number, warehouseId?: number) {
    return this.repo.getLots(materialId, warehouseId);
  }

  async getTransfers(status?: string) {
    return this.repo.getTransfers(status);
  }

  async createTransfer(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createTransfer(body, userId);
  }

  async getInternalRequests(status?: string) {
    return this.repo.getInternalRequests(status);
  }

  async createInternalRequest(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createInternalRequest(body, userId);
  }

  async getGoodsReceipts(status?: string) {
    return this.repo.getGoodsReceipts(status);
  }

  async createGoodsReceipt(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createGoodsReceipt(body, userId);
  }

  async getGoodsReceiptStats() {
    return this.repo.getGoodsReceiptStats();
  }

  async getGoodsReceiptLines(receiptId: number) {
    return this.repo.getGoodsReceiptLines(receiptId);
  }

  async addGoodsReceiptLine(receiptId: number, body: Record<string, unknown>) {
    return this.repo.addGoodsReceiptLine(receiptId, body);
  }

  async qcLine(lineId: number, passed: boolean, notes: string | null, userId: number | null) {
    return this.repo.qcLine(lineId, passed, notes, userId);
  }

  /**
   * Karantin darvozasi bilan REAL majburlangan tugatish.
   * Qabul MAIN omborga (completed) faqat QC_PASS holatidan o'tadi —
   * karantindagi yoki QC o'tmagan qabul BLOK qilinadi (UI emas, backend).
   * EP-WMS-003/016/017 (5-bosqich) + Q-40 (ishlaydi ≠ to'g'ri).
   *
   * @returns Result — gate buzilsa Err(BUSINESS_RULE_VIOLATION); aks holda Ok(qabul satri).
   */
  async completeGoodsReceipt(receiptId: number, userId: number | null): GatewayResult<ReceiptStatusRow> {
    // releaseToMain darvozasi yagona haqiqat manbai: QC_PASS shart, so'ngra
    // status=MAIN + completed_by/completed_at yoziladi. Legacy repo.completeGoodsReceipt
    // (status='completed') CHAQIRILMAYDI — u darvozani aylanib o'tib MAIN ni clobber qilardi.
    return this.quarantineGate.releaseToMain(receiptId, userId);
  }

  /**
   * Tashqi kirimni karantinga yuborish (DRAFT → KARANTIN).
   * Stok bu bosqichda MAIN omborga tushmaydi.
   */
  async sendToQuarantine(receiptId: number, userId: number | null): GatewayResult<ReceiptStatusRow> {
    return this.quarantineGate.sendToQuarantine(receiptId, userId);
  }

  /**
   * QC qarorini (QABUL/REWORK/CHIQARISH) qabulga qo'llash.
   * QABUL → QC_PASS, REWORK → REWORK, CHIQARISH → REJECT (faqat KARANTIN dan).
   */
  async qcReceiptDecision(
    receiptId: number,
    decision: 'QABUL' | 'REWORK' | 'CHIQARISH',
    inspectorId: number | null,
    note?: string | null,
  ): GatewayResult<ReceiptStatusRow> {
    return this.quarantineGate.applyQcDecision(receiptId, decision, inspectorId, note);
  }

  async lowStock() {
    return this.repo.getLowStock();
  }

  async barcodeScan(barcode: string) {
    return this.repo.barcodeScan(barcode);
  }

  async warehouseExists(numericId: number | null, code: string | number): Promise<boolean> {
    return this.repo.warehouseExists(numericId, code);
  }

  async logPosSyncEvent(warehouseId: number | null, userId: number | null): Promise<void> {
    return this.repo.logPosSyncEvent(warehouseId, userId);
  }
}
