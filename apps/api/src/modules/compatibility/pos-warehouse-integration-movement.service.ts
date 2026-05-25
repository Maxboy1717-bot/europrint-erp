/**
 * @module pos-warehouse-integration-movement.service
 * @description POS↔Warehouse movement transactional write path — kept separate
 *   from the parent `PosWarehouseIntegrationService` facade so each file stays
 *   under 300 lines (Rule 16).
 *
 *   Movement turlari:
 *     - DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL (EXTERNAL_IN — 5 bosqich)
 *     - DRAFT → MENEJER (INTERNAL_ISSUE — 1 bosqich)
 *     - DRAFT (INTERNAL_RETURN — tasdiq yo'q)
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { rawSql, db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

export interface PosMovementDto {
  movementType: 'EXTERNAL_IN' | 'EXTERNAL_OUT' | 'INTERNAL_ISSUE' | 'INTERNAL_RETURN' | 'INTERNAL_TRANSFER' | 'DAMAGE';
  fromWarehouseId?: number;
  toWarehouseId?: number;
  materialCardId: number;
  quantity: number;
  performedBy: number;
  reason?: string;
  notes?: string;
  barcode?: string;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const OUTBOUND_TYPES = ['EXTERNAL_OUT', 'INTERNAL_ISSUE', 'INTERNAL_TRANSFER', 'DAMAGE'];
const INBOUND_TYPES = ['EXTERNAL_IN', 'INTERNAL_RETURN', 'INTERNAL_TRANSFER'];

@Injectable()
export class PosWarehouseIntegrationMovementService {
  private readonly logger = new Logger(PosWarehouseIntegrationMovementService.name);

  /**
   * POS movement yaratish — har turi uchun mos workflow.
   * Atomic: material_movement + warehouse_stock update.
   */
  async createMovement(dto: PosMovementDto): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      this.validateMovementDto(dto);
      if (OUTBOUND_TYPES.includes(dto.movementType)) {
        await this.validateOutboundStock(dto);
      }
      if (INBOUND_TYPES.includes(dto.movementType) && !dto.toWarehouseId) {
        throw new BadRequestException(`${dto.movementType} uchun toWarehouseId majburiy`);
      }
      return await db.transaction(async (tx) => this.executeMovement(tx, dto));
    });
  }

  private validateMovementDto(dto: PosMovementDto): void {
    if (!dto.materialCardId) throw new BadRequestException('materialCardId majburiy');
    if (!dto.quantity || dto.quantity <= 0) throw new BadRequestException("quantity > 0 bo'lishi kerak");
    if (!dto.performedBy) throw new BadRequestException('performedBy majburiy');
  }

  private async validateOutboundStock(dto: PosMovementDto): Promise<void> {
    if (!dto.fromWarehouseId) {
      throw new BadRequestException(`${dto.movementType} uchun fromWarehouseId majburiy`);
    }
    const stockRows = await rawSql(sql`
      SELECT available_quantity, material_type FROM pos_warehouse_stock_view
      WHERE warehouse_id = ${dto.fromWarehouseId} AND material_card_id = ${dto.materialCardId}
      LIMIT 1
    `);
    const stock = dbRows(stockRows)[0];
    if (!stock) {
      throw new BadRequestException(
        `Material #${dto.materialCardId} ombor #${dto.fromWarehouseId} da yo'q`,
      );
    }
    const available = Number(stock['available_quantity']);
    if (available < dto.quantity) {
      // PRD Q38: ASSET → BLOCK, CONSUMABLE → OGOHLANTIRISH (lekin ruxsat)
      if (stock['material_type'] === 'ASSET') {
        throw new BadRequestException(
          `Aktiv yetarli emas. Mavjud: ${available}, So'ralgan: ${dto.quantity}. Aktivlar uchun minus saldo BLOK.`,
        );
      }
      this.logger.warn(`Minus saldo: material #${dto.materialCardId}, available=${available}, requested=${dto.quantity}`);
    }
  }

  private async executeMovement(tx: Tx, dto: PosMovementDto): Promise<object> {
    const movementId = await this.insertMovementRow(tx, dto);
    if (dto.fromWarehouseId) await this.decreaseFromWarehouseStock(tx, dto);
    if (dto.toWarehouseId) await this.increaseToWarehouseStock(tx, dto);
    await this.refreshMaterialCurrentStock(tx, dto.materialCardId);
    this.logger.log(`Movement #${movementId} ${dto.movementType} qty=${dto.quantity}`);
    return {
      movementId,
      movementType: dto.movementType,
      materialCardId: dto.materialCardId,
      quantity: dto.quantity,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      status: 'completed',
    };
  }

  private async insertMovementRow(tx: Tx, dto: PosMovementDto): Promise<number> {
    const movementRows = await tx.execute(sql`
      INSERT INTO material_movements (
        material_id, material_name, movement_type, quantity, unit,
        barcode, scanned_at, performed_by, reason, notes, created_at
      )
      SELECT
        ${dto.materialCardId}, mc.xom_ashyo, ${dto.movementType}, ${dto.quantity},
        mc.unit_of_measure, ${dto.barcode ?? null}, NOW(), ${dto.performedBy},
        ${dto.reason ?? null}, ${dto.notes ?? null}, NOW()
      FROM material_cards mc
      WHERE mc.id = ${dto.materialCardId}
      RETURNING id
    `);
    const movement = dbRows(movementRows)[0];
    return Number(movement?.['id'] ?? 0);
  }

  private async decreaseFromWarehouseStock(tx: Tx, dto: PosMovementDto): Promise<void> {
    await tx.execute(sql`
      UPDATE warehouse_stock
      SET quantity = quantity - ${dto.quantity},
          available_quantity = available_quantity - ${dto.quantity},
          last_updated_at = NOW()
      WHERE warehouse_id = ${dto.fromWarehouseId} AND material_card_id = ${dto.materialCardId}
    `);
  }

  private async increaseToWarehouseStock(tx: Tx, dto: PosMovementDto): Promise<void> {
    await tx.execute(sql`
      INSERT INTO warehouse_stock (
        warehouse_id, material_card_id, quantity, reserved_quantity,
        available_quantity, unit_of_measure, last_updated_at, created_at
      )
      SELECT
        ${dto.toWarehouseId}, ${dto.materialCardId}, ${dto.quantity}, 0,
        ${dto.quantity}, mc.unit_of_measure, NOW(), NOW()
      FROM material_cards mc
      WHERE mc.id = ${dto.materialCardId}
      ON CONFLICT (warehouse_id, material_card_id) DO UPDATE
      SET quantity = warehouse_stock.quantity + EXCLUDED.quantity,
          available_quantity = warehouse_stock.available_quantity + EXCLUDED.quantity,
          last_updated_at = NOW()
    `);
  }

  private async refreshMaterialCurrentStock(tx: Tx, materialCardId: number): Promise<void> {
    await tx.execute(sql`
      UPDATE material_cards
      SET current_stock = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM warehouse_stock
        WHERE material_card_id = ${materialCardId}
      ),
      updated_at = NOW()
      WHERE id = ${materialCardId}
    `);
  }
}
