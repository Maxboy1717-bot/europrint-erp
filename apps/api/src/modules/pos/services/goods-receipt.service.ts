/**
 * goods-receipt.service.ts
 * Qabul Akti (GRN) — POS Monitor va ERP uchun yagona xizmat.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Err, AppError } from '@common/result';
import { GoodsReceiptRepository, type GoodsReceipt } from '../repositories/goods-receipt.repository';

// Re-export so controllers/other services can continue importing from here
export type { GoodsReceipt };

@Injectable()
export class GoodsReceiptService {
  private readonly logger = new Logger(GoodsReceiptService.name);

  constructor(private readonly repo: GoodsReceiptRepository) {}

  async findAll(filters?: {
    status?:       string;
    warehouseId?:  number;
    supplierName?: string;
    dateFrom?:     string;
    dateTo?:       string;
    limit?:        number;
  }): Promise<Result<GoodsReceipt[], AppError>> {
    return this.repo.findAll(filters);
  }

  async create(dto: {
    supplierName:    string;
    supplierTin?:    string;
    warehouseId:     number;
    waybillNumber?:  string;
    contractNumber?: string;
    totalAmount?:    number;
    currency?:       string;
    notes?:          string;
    movementId?:     number;
    purchaseOrderId?: string;
    receivedBy:      number;
  }): Promise<Result<{ id: number; grnNumber: string }, AppError>> {
    // GRN raqami avtomatik: GRN-YYYY-NNNNN
    const cntResult  = await this.repo.countByCurrentYear();
    const cnt        = cntResult.ok ? cntResult.data : 0;
    const year       = new Date().getFullYear();
    const grnNumber  = `GRN-${year}-${String(cnt + 1).padStart(5, '0')}`;

    const result = await this.repo.insert({ ...dto, grnNumber });
    if (result.ok) {
      this.logger.log(`[GRN] ✅ ${grnNumber} yaratildi (id=${result.data.id}, supplier=${dto.supplierName})`);
      return { ok: true, data: { id: result.data.id, grnNumber } } as Result<{ id: number; grnNumber: string }, AppError>;
    }
    return Err(result.error);
  }

  async approve(id: number, approvedBy: number): Promise<Result<void, AppError>> {
    return this.repo.approve(id, approvedBy);
  }
}
