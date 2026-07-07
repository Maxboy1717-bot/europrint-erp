/**
 * @module pos-inventory-count-query.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';
import type {
  RecordActualQtyDto,
  BulkRecordActualQtyDto,
  CountFilterDto,
  CountVarianceResultDto,
} from '../../dto/inventory-count.dto';
import { PosInventoryCountQueryRepository, type Executor } from '../../infrastructure/repositories/pos-inventory-count-query.repository';

@Injectable()
export class PosInventoryCountQueryService {
  private readonly logger = new Logger(PosInventoryCountQueryService.name);

  constructor(
    private readonly repo: PosInventoryCountQueryRepository,
    private readonly i18n: I18nService,
  ) {}

  async snapshotStock(
    countId: number,
    warehouseId: string,
    categoryFilter?: string,
  ): Promise<Result<void, AppError>> {
    return this.repo.snapshotStock(countId, warehouseId, categoryFilter);
  }

  async recordActualQty(
    dto: RecordActualQtyDto,
    countedById: number,
    _ipAddress?: string,
    executor?: Executor,
  ) {
    const lineR = await this.repo.findLine(dto.lineId, executor);
    if (!lineR.ok || !lineR.data) throw new NotFoundException(await this.i18n.t('errors.inventoryCountLineNotFound', { args: { id: dto.lineId } }));
    const line = lineR.data as { materialCardId: number; systemQty: number | string; binLocation?: string };

    if (dto.scannedBarcode) {
      const match = await this.repo.checkBarcode(line.materialCardId, dto.scannedBarcode, executor);
      if (!match) {
        throw new BadRequestException(await this.i18n.t('errors.scannedBarcodeMismatch'));
      }
    }

    const variance = dto.actualQty - Number(line.systemQty);

    await this.repo.updateCountLine(dto.lineId, {
      actualQty:   dto.actualQty,
      varianceQty: variance,
      binLocation: dto.binLocation ?? line.binLocation ?? undefined,
      countedBy:   countedById,
      countedAt:   _time.now(),
      notes:       dto.notes,
    }, executor);

    return { lineId: dto.lineId, actualQty: dto.actualQty, variance };
  }

  /**
   * C-5.5 (CRITICAL-CORRECTNESS-AUDIT) — previously looped calling recordActualQty() once per
   * line with NO shared transaction: each line's find+update ran in its own implicit
   * one-statement transaction, so a failure partway through (e.g. line 3 of 3 not found, or a
   * barcode mismatch) left lines 1..2 already persisted — a partially-applied bulk count
   * (Q-40 "ishlaydi ≠ to'g'ri"). All lines of ONE bulk-record call now share a SINGLE
   * db.transaction (via repo.runInTransaction — same all-or-nothing convention as
   * warehouse-config.service.ts#receiveStock / auto-gl-posting.repository.ts#insertPostingsAtomic):
   * any line's failure throws, the transaction rolls back, and NONE of the batch's writes persist.
   */
  async bulkRecordActualQty(dto: BulkRecordActualQtyDto, countedById: number) {
    return this.repo.runInTransaction(async (tx) => {
      const results = [];
      for (const line of dto.lines) {
        const result = await this.recordActualQty(line, countedById, undefined, tx);
        results.push(result);
      }
      return results;
    });
  }

  async getVarianceReport(countId: number): Promise<CountVarianceResultDto> {
    const invCountR = await this.repo.findCount(countId);
    if (!invCountR.ok || !invCountR.data) throw new NotFoundException(await this.i18n.t('errors.inventoryCountNotFound', { args: { id: countId } }));
    const invCount = invCountR.data as { countNumber: string; warehouseId: string };

    const allLinesR = await this.repo.getVarianceLines(countId);
    const allLinesRaw = allLinesR.ok ? allLinesR.data as Record<string, unknown>[] : [];
    const allLines = Array.isArray(allLinesRaw) ? allLinesRaw : [];
    const varianceLines = (Array.isArray(allLines) ? allLines : []).filter(l => l['variance_calc'] !== 0);
    const totalVarianceValue = (Array.isArray(varianceLines) ? varianceLines : []).reduce((s, l) => s + Number(l['variance_value'] ?? 0), 0);

    return {
      countId,
      countNumber:       invCount.countNumber,
      warehouseId:       invCount.warehouseId,
      totalLines:        allLines.length,
      matchedLines:      allLines.length - varianceLines.length,
      varianceLines:     varianceLines.length,
      totalVarianceValue,
      lines: (Array.isArray(allLines) ? allLines : []).map(l => ({
        materialCardId: Number(l['material_id']),
        materialName: String(l['material_name'] ?? ''),
        systemQty:       Number(l['system_qty'] ?? 0),
        actualQty:       Number(l['actual_qty'] ?? 0),
        variance:        Number(l['variance_calc'] ?? 0),
        varianceValue:   Number(l['variance_value'] ?? 0),
        binLocation: String(l['bin_location'] ?? ''),
      })),
    };
  }

  async findAll(filter: CountFilterDto) {
    return this.repo.findAll(filter);
  }
}
