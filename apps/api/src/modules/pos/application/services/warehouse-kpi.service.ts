/**
 * warehouse-kpi.service.ts
 * Real-time KPI ko'rsatgichlar — har ombor bo'yicha va umumiy.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { WarehouseKpiRepository } from '../../infrastructure/repositories/warehouse-kpi.repository';

export interface WarehouseKpi {
  warehouseId:        number;
  warehouseCode:      string;
  warehouseName:      string;
  warehouseType:      string;
  totalMaterials:     number;
  totalQuantity:      number;
  totalValue:         number;
  lowStockCount:      number;
  outOfStockCount:    number;
  movementsToday:     number;
  movementsThisWeek:  number;
  pendingApprovals:   number;
  employeeCount:      number;
  primaryUnit:        string;
  units: Array<{ unit: string; count: number; quantity: number }>;
}

export interface SystemKpi {
  totalWarehouses:    number;
  totalMaterials:     number;
  totalStockValue:    number;
  lowStockAlerts:     number;
  pendingMovements:   number;
  qcPending:          number;
  todayMovements:     number;
  weeklyMovements:    number;
  monthlyMovements:   number;
  topWarehouses:      Array<{ code: string; name: string; valueShare: number }>;
  movementsByType:    Array<{ type: string; count: number; label: string }>;
}

const MOVEMENT_LABELS: Record<string, string> = {
  EXTERNAL_IN:       'Tashqi Kirim',
  EXTERNAL_OUT:      'Tashqi Chiqim',
  INTERNAL_ISSUE:    'Bo\'limga Berish',
  INTERNAL_RETURN:   'Qaytarish',
  INTERNAL_TRANSFER: 'Ombor Ko\'chirish',
  DAMAGE:            'Zarar Akti',
  INVENTORY_ADJUST:  'Inventarizatsiya',
};

@Injectable()
export class WarehouseKpiService {
  private readonly logger = new Logger(WarehouseKpiService.name);

  constructor(private readonly repo: WarehouseKpiRepository) {}

  async getWarehouseKpis(): Promise<Result<WarehouseKpi[], AppError>> {
    try {
      const rows = await this.repo.getWarehouseKpisBase();
      const result: WarehouseKpi[] = [];

      for (const row of rows) {
        const units = await this.repo.getUnitBreakdown(row.warehouseId);
        result.push({
          ...row,
          totalQuantity: Number(row.totalQuantity ?? 0),
          totalValue:    Number(row.totalValue    ?? 0),
          primaryUnit:   units[0]?.unit ?? '—',
          units,
        });
      }

      return Ok(result);
    } catch (e) {
      this.logger.error(`[KPI] Xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async getSystemKpi(): Promise<Result<SystemKpi, AppError>> {
    try {
      const [base, topRows, movTypeRows] = await Promise.all([
        this.repo.getSystemKpiBase(),
        this.repo.getTopWarehouses(),
        this.repo.getMovementsByType(),
      ]);

      const totalValueAll  = topRows.reduce((s, r) => s + Number(r.value), 0);
      const topWarehouses  = topRows.map(r => ({
        code: r.code,
        name: r.name,
        valueShare: totalValueAll > 0 ? Math.round((Number(r.value) / totalValueAll) * 100) : 0,
      }));
      const movementsByType = movTypeRows.map(r => ({
        type: r.type, count: r.count, label: MOVEMENT_LABELS[r.type] ?? r.type,
      }));

      return Ok({
        totalWarehouses:   Number(base['total_warehouses']  ?? 0),
        totalMaterials:    Number(base['total_materials']   ?? 0),
        totalStockValue:   Number(base['total_stock_value'] ?? 0),
        lowStockAlerts:    Number(base['low_stock_alerts']  ?? 0),
        pendingMovements:  Number(base['pending_movements'] ?? 0),
        qcPending:         Number(base['qc_pending']        ?? 0),
        todayMovements:    Number(base['today_movements']   ?? 0),
        weeklyMovements:   Number(base['weekly_movements']  ?? 0),
        monthlyMovements:  Number(base['monthly_movements'] ?? 0),
        topWarehouses,
        movementsByType,
      });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
