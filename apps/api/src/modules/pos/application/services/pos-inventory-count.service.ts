/**
 * @module pos-inventory-count.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Inventory Count Service (Inventarizatsiya)
 *
 * To'liq inventarizatsiya jarayoni:
 *  1. Count yaratish → Tizim balansini snapshot olish
 *  2. Xodimlar haqiqiy miqdorni skanerlaydi va kiritadi
 *  3. Farqlar hisoblanadi (variance)
 *  4. Menejer tasdiqlaydi
 *  5. GL posting: INVENTORY_ADJ_PLUS/MINUS harakatlari yaratiladi
 */

import {
  Injectable, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common'; 
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { PosInventoryCountRepository } from '../../infrastructure/repositories/pos-inventory-count.repository';

import { PosMovementService } from './pos-movement.service';
import { PosAuditService }    from './pos-audit.service';
import { PosInventoryCountQueryService } from './pos-inventory-count-query.service';
import { PosVarianceConfigService } from './pos-variance-config.service';

import {
  CreateInventoryCountDto,
  RecordActualQtyDto,
  BulkRecordActualQtyDto,
  ApproveInventoryCountDto,
  CountFilterDto,
  CountVarianceResultDto,
} from '../../dto/inventory-count.dto';
// RecordActualQtyDto + BulkRecordActualQtyDto still referenced for delegation signatures

@Injectable()
export class PosInventoryCountService {
  private readonly logger = new Logger(PosInventoryCountService.name);

  constructor(
    private readonly movementService: PosMovementService,
    private readonly auditService:    PosAuditService,
    private readonly eventEmitter:    EventEmitter2,
    private readonly queryService:    PosInventoryCountQueryService,
    private readonly inventoryRepo:   PosInventoryCountRepository,
    private readonly varianceConfig:  PosVarianceConfigService,
  ) {}

  // ─── P4: Farq avto-tasdiq / eskalatsiya qarori ────────────────────────────
  //
  // ADDITIVE (Q-46): mavjud `approveCount` o'zgarmaydi. Bu metod farqlarni
  // chegaraga solishtirib AUTO_APPROVE (chegara ichida) yoki ESCALATE (oshdi —
  // menejer-tasdiq) qaroriga keladi. FE/controller bu qarorga qarab avto-tasdiq
  // tugmasini ko'rsatadi yoki menejer-tasdiqqa yo'naltiradi.

  async evaluateVarianceDecision(countId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const invCountR = await this.inventoryRepo.findById(countId);
      if (!invCountR.ok || !invCountR.data) throw new NotFoundException(`Inventarizatsiya topilmadi: ${countId}`);
      const invCount = invCountR.data as Record<string, unknown>;

      const warehouseRaw = invCount['warehouseId'] ?? invCount['warehouse_id'];
      const warehouseId = warehouseRaw != null && Number.isFinite(Number(warehouseRaw))
        ? Number(warehouseRaw)
        : null;

      const varLinesR = await this.inventoryRepo.getVarianceLines(countId);
      const varLines = varLinesR.ok && Array.isArray(varLinesR.data) ? varLinesR.data : [];

      const lines = varLines.map((l) => ({
        systemQty:     Number(l['system_qty'] ?? l['system_quantity'] ?? 0),
        varianceQty:   Number(l['variance_qty'] ?? l['variance'] ?? 0),
        varianceValue: Number(l['variance_value'] ?? l['value_variance'] ?? 0),
      }));

      const decisionR = await this.varianceConfig.decideForCount(warehouseId, lines);
      if (!decisionR.ok) throw new BadRequestException(decisionR.error.message);

      return {
        countId,
        warehouseId,
        varianceLineCount: lines.length,
        ...decisionR.data,
      };
    });
  }

  // ─── Inventarizatsiya Yaratish ────────────────────────────────────────────

  async createCount(
    dto: CreateInventoryCountDto,
    createdById: number,
    ipAddress?: string,
  ): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      // Ombor mavjudligini tekshirish
      const whR = await this.inventoryRepo.getWarehouseById(dto.warehouseId);
      if (!whR.ok) throw new NotFoundException(`Ombor topilmadi: ${dto.warehouseId}`);
  
      // Faol count bormi tekshirish
      const activeCountR = await this.inventoryRepo.findActiveCountForWarehouse(dto.warehouseId);

      if (activeCountR.ok && activeCountR.data) {
        const activeData = activeCountR.data as { countNumber: string };
        throw new BadRequestException(
          `Bu omborda allaqachon faol inventarizatsiya mavjud: ${activeData.countNumber}`,
        );
      }
  
      // Count raqami
      const totalCountR = await this.inventoryRepo.countAll();
      const totalCount = totalCountR.ok ? (totalCountR.data as number) : 0;
      const countNumber = `INV-${_time.now().getFullYear()}-${String(totalCount + 1).padStart(4, '0')}`;
  
      // Inventarizatsiya yaratish
      const inventoryCountR = await this.inventoryRepo.createCount({
        countNumber,
        warehouseId:       dto.warehouseId,
        // FAZA E (Inventarizatsiya, 2026-07-01) — kanonik ustun NOT NULL; avval Drizzle
        // sxemasida umuman yo'q edi → INSERT doim `count_type` NOT NULL xatosi bilan
        // yiqilardi (pre-existing bug, shu funksiya ichida — Q-46 bo'yicha to'g'irlandi).
        countType:         'cycle',
        status:            'DRAFT',
        countDate:         dto.countDate ? new Date(dto.countDate) : _time.now(),
        categoryFilter:    dto.categoryFilter,
        binLocationFilter: dto.binLocationFilter,
        conductedBy:       createdById,
        notes:             dto.notes,
        // "Davriy (rejalashtirilgan)" sana endi saqlanadi (ilgari FE "New Plan" formasidagi
        // scheduledFor DTO'da yo'q edi — jim tashlab yuborilardi).
        scheduledFor:      dto.scheduledFor ?? null,
      } as Parameters<typeof this.inventoryRepo.createCount>[0]);
      const inventoryCount = inventoryCountR.ok ? (inventoryCountR.data as { id: number }) : { id: 0 };
  
      // Joriy stock balance snapshot
      await this.queryService.snapshotStock(inventoryCount.id, dto.warehouseId, dto.categoryFilter);
  
      // Draft → in_progress
      await this.inventoryRepo.startCount(inventoryCount.id);
  
      await this.auditService.log({
        userId:     createdById,
        action:     'pos.inventory_count.created',
        entityType: 'pos_inventory_counts',
        entityId:   inventoryCount.id,
        newValue:   { countNumber, warehouseId: dto.warehouseId },
        ipAddress,
      });
  
      this.logger.log(`Inventarizatsiya yaratildi: ${countNumber}`);
      return { ...inventoryCount, status: 'IN_PROGRESS' };
    });
  }

  // ─── Haqiqiy Miqdor Kiritish (delegate) ──────────────────────────────────

  async recordActualQty(dto: RecordActualQtyDto, countedById: number, ipAddress?: string) {
    return this.queryService.recordActualQty(dto, countedById, ipAddress);
  }

  async bulkRecordActualQty(dto: BulkRecordActualQtyDto, countedById: number) {
    return this.queryService.bulkRecordActualQty(dto, countedById);
  }

  // ─── Inventarizatsiya Tasdiqlash ──────────────────────────────────────────

  async approveCount(
    dto: ApproveInventoryCountDto,
    approvedById: number,
    ipAddress?: string,
  ) {
    const invCountR = await this.inventoryRepo.findById(dto.countId);
    if (!invCountR.ok) throw new NotFoundException(`Inventarizatsiya topilmadi: ${dto.countId}`);
    const invCount = invCountR.data as Record<string, unknown>;
    if (invCount.status !== 'IN_PROGRESS' && invCount.status !== 'COMPLETED') {
      throw new BadRequestException(`Inventarizatsiya tasdiqlab bo'lmaydi: ${invCount.status}`);
    }

    // Barcha satrlar kiritilganmi tekshirish
    const nullCount = await this.inventoryRepo.getNullLinesCount(dto.countId);

    if ((nullCount.ok ? nullCount.data as number : 0) > 0) {
      throw new BadRequestException(
        `${nullCount.ok ? nullCount.data : 0} ta satr hali kiritilmagan. Barchasini kiriting.`,
      );
    }

    // GL posting — farqli satrlar uchun harakatlar yaratish
    if (dto.applyAdjustments) {
      await this._applyGlAdjustments(invCount, approvedById, ipAddress);
    }

    // Count yakunlash
    const updated = await this.inventoryRepo.finalizeCount(dto.countId, {
      status:       'GL_POSTED',
      completedAt:  _time.now(),
      approvedBy:   approvedById,
      updatedAt:    _time.now(),
    });

    await this.auditService.log({
      userId:     approvedById,
      action:     'pos.inventory_count.approved',
      entityType: 'pos_inventory_counts',
      entityId:   dto.countId,
      newValue:   { status: 'GL_POSTED', applyAdjustments: dto.applyAdjustments },
      ipAddress,
    });

    this.eventEmitter.emit('pos.inventory_count.completed', {
      countId:     dto.countId,
      countNumber: invCount.countNumber,
      approvedById,
    });

    return updated;
  }

  // ─── GL Adjustment Harakatlari ────────────────────────────────────────────

  private async _applyGlAdjustments(
    invCount: Record<string, unknown>,
    approvedById: number,
    ipAddress?: string,
  ) {
    const varianceLines = await this.inventoryRepo.getVarianceLines(invCount.id as number);

    for (const line of (varianceLines.ok ? varianceLines.data : [])) {
      // getVarianceLines aliases the computed diff as `variance_calc`; physical id col is `material_id`.
      const variance = Number(line.variance_calc);
      if (variance === 0 || Number.isNaN(variance)) continue;

      const isPlus = variance > 0;
      const adjTypeCode = isPlus ? 'INVENTORY_ADJ_PLUS' : 'INVENTORY_ADJ_MINUS';

      const adjType = await this.inventoryRepo.getMovementTypeByCode(adjTypeCode);
      if (!adjType || !adjType.ok || adjType.data === null) throw new BadRequestException(`Harakat turi topilmadi: ${adjTypeCode}`);

      await this.movementService.createMovement(
        {
          movementTypeId: Number(adjType.data?.id ?? 0),
          fromWarehouseId: isPlus ? undefined : String(invCount.warehouseId),
          toWarehouseId: isPlus ? String(invCount.warehouseId) : undefined,
          lines: [{
            materialCardId: Number(line.material_id),
            quantity: Math.abs(variance),
          }],
          notes: `Inventarizatsiya tuzatmasi: ${invCount.countNumber}`,
        },
        approvedById,
        ipAddress,
      );

      // Satrani GL posted deb belgilash
      await this.inventoryRepo.markLineGlPosted(line.id);
    }

    this.logger.log(
      `GL tuzatmalar qo'llandi: ${(varianceLines.ok ? (varianceLines.data as Record<string, unknown>[]).length : 0)} satr, count=${invCount.countNumber}`,
    );
  }

  // ─── Farq Hisoboti (delegate) ─────────────────────────────────────────────

  async getVarianceReport(countId: number): Promise<CountVarianceResultDto> {
    return this.queryService.getVarianceReport(countId);
  }

  // ─── Inventarizatsiyalar Ro'yxati (delegate) ──────────────────────────────

  async findAll(filter: CountFilterDto) {
    return this.queryService.findAll(filter);
  }
}
