/**
 * pos-warehouse-integration.service.ts
 *
 * PRD Q21-58: POS ↔ Warehouse to'liq integratsiya.
 *
 * Asosiy printsiplar:
 *   1. POS warehouse_stock'dan REAL-TIME stok o'qiydi
 *   2. Har POS harakat material_movements'ga yoziladi (audit trail)
 *   3. Stok warehouse'da yangilanadi (UPDATE warehouse_stock)
 *   4. Movement turlari: EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE
 *
 * Facade — delegates to two sub-services to keep this file under 300 lines
 * (Rule 16). Public method names + signatures unchanged.
 *   - PosWarehouseIntegrationQueriesService — stock / barcode / history / alerts
 *   - PosWarehouseIntegrationMovementService — createMovement (transactional)
 */
import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import {
  PosWarehouseIntegrationMovementService,
  PosMovementDto,
} from './pos-warehouse-integration-movement.service';
import { PosWarehouseIntegrationQueriesService } from './pos-warehouse-integration-queries.service';

// Re-export the DTO interface so existing imports (`MovementDto` from this
// module) continue to work. Some callers may import this type directly.
export type MovementDto = PosMovementDto;

@Injectable()
export class PosWarehouseIntegrationService {
  constructor(
    private readonly queries: PosWarehouseIntegrationQueriesService,
    private readonly movements: PosWarehouseIntegrationMovementService,
  ) {}

  getRealTimeStock(filters?: {
    warehouseId?: number;
    category?: string;
    onlyAvailable?: boolean;
    search?: string;
  }): Promise<Result<unknown, AppError>> {
    return this.queries.getRealTimeStock(filters);
  }

  findByBarcode(barcode: string): Promise<Result<unknown, AppError>> {
    return this.queries.findByBarcode(barcode);
  }

  createMovement(dto: MovementDto): Promise<Result<unknown, AppError>> {
    return this.movements.createMovement(dto);
  }

  getMovementHistory(filters?: {
    materialCardId?: number;
    warehouseId?: number;
    movementType?: string;
    limit?: number;
  }): Promise<Result<unknown, AppError>> {
    return this.queries.getMovementHistory(filters);
  }

  getStockAlerts(): Promise<Result<unknown, AppError>> {
    return this.queries.getStockAlerts();
  }
}
