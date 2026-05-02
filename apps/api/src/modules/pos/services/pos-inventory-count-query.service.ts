import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import type {
  RecordActualQtyDto,
  BulkRecordActualQtyDto,
  CountFilterDto,
  CountVarianceResultDto,
} from '../dto/inventory-count.dto';
import { PosInventoryCountQueryRepository } from '../repositories/pos-inventory-count-query.repository';

@Injectable()
export class PosInventoryCountQueryService {
  private readonly logger = new Logger(PosInventoryCountQueryService.name);

  constructor(private readonly repo: PosInventoryCountQueryRepository) {}

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
  ) {
    const lineR = await this.repo.findLine(dto.lineId);
    if (!lineR.ok || !lineR.data) throw new NotFoundException(`Inventarizatsiya satri topilmadi: ${dto.lineId}`);
    const line = lineR.data as { materialCardId: number; systemQty: number | string; binLocation?: string };

    if (dto.scannedBarcode) {
      const match = await this.repo.checkBarcode(line.materialCardId, dto.scannedBarcode);
      if (!match) {
        throw new BadRequestException(`Skanerlangan barcode ushbu material uchun mos kelmaydi`);
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
    });

    return { lineId: dto.lineId, actualQty: dto.actualQty, variance };
  }

  async bulkRecordActualQty(dto: BulkRecordActualQtyDto, countedById: number) {
    const results = [];
    for (const line of dto.lines) {
      const result = await this.recordActualQty(line, countedById);
      results.push(result);
    }
    return results;
  }

  async getVarianceReport(countId: number): Promise<CountVarianceResultDto> {
    const invCountR = await this.repo.findCount(countId);
    if (!invCountR.ok || !invCountR.data) throw new NotFoundException(`Inventarizatsiya topilmadi: ${countId}`);
    const invCount = invCountR.data as { countNumber: string; warehouseId: string };

    const allLinesR = await this.repo.getVarianceLines(countId);
    const allLinesRaw = allLinesR.ok ? allLinesR.data as Record<string, unknown>[] : [];
    const allLines = Array.isArray(allLinesRaw) ? allLinesRaw : [];
    const varianceLines = (allLines ?? []).filter(l => l['variance_calc'] !== 0);
    const totalVarianceValue = (varianceLines ?? []).reduce((s, l) => s + Number(l['variance_value'] ?? 0), 0);

    return {
      countId,
      countNumber:       invCount.countNumber,
      warehouseId:       invCount.warehouseId,
      totalLines:        allLines.length,
      matchedLines:      allLines.length - varianceLines.length,
      varianceLines:     varianceLines.length,
      totalVarianceValue,
      lines: (Array.isArray(allLines) ? allLines : []).map(l => ({
        materialCardId: Number(l['material_card_id']),
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
