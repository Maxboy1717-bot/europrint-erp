import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { WmsWarehouseGatewayRepo } from '../infrastructure/wms-warehouse-gateway.repo';

type GatewayResult<T> = Promise<Result<T, AppError>>;

@Injectable()
export class WmsWarehouseGatewayService {
  constructor(private readonly repo: WmsWarehouseGatewayRepo) {}

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

  async qcLine(lineId: number, passed: boolean, notes: string | null, userId: number | null) {
    return this.repo.qcLine(lineId, passed, notes, userId);
  }

  async completeGoodsReceipt(receiptId: number, userId: number | null) {
    return this.repo.completeGoodsReceipt(receiptId, userId);
  }

  async lowStock() {
    return this.repo.getLowStock();
  }

  async barcodeScan(barcode: string) {
    return this.repo.barcodeScan(barcode);
  }
}
