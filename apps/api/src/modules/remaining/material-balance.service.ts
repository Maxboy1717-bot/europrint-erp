import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MaterialBalanceRepository } from './material-balance.repository';

@Injectable()
export class MaterialBalanceService {
  private readonly logger = new Logger(MaterialBalanceService.name);

  constructor(private readonly repo: MaterialBalanceRepository) {}

  async getOverview(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const row = await this.repo.getOverview();
      const d = (row?.data ?? {}) as Record<string, unknown>;
      return {
        success: true,
        data: {
          totalMaterials:     Number(d['total_count']          ?? 0),
          totalStockValue:    Number(d['total_stock_value']    ?? 0),
          lowStockAlerts:     Number(d['low_stock_count']      ?? 0),
          criticalStockCount: Number(d['critical_stock_count'] ?? 0),
        },
      };
    });
  }

  async getAlerts() {
    return safeCall(async () => {
      const alertsR = await this.repo.getAlerts();
      const alertsRaw = (alertsR.ok ? alertsR.data as Record<string, unknown>[] : []);
      const alerts = (Array.isArray(alertsRaw) ? alertsRaw : []).map((a) => ({
        ...a,
        severity: Number(a['current_stock'] ?? 0) <= 0 ? 'critical' : 'warning',
        deficit:  Math.max(0, Number(a['min_stock'] ?? 0) - Number(a['current_stock'] ?? 0)),
      }));
      return {
        success: true, data: alerts, total: alerts.length,
        criticalCount: (Array.isArray(alerts) ? alerts : []).filter((a) => a.severity === 'critical').length,
        warningCount:  (Array.isArray(alerts) ? alerts : []).filter((a) => a.severity === 'warning').length,
      };
    });
  }

  async getInternalRequests() {
    return this.repo.getInternalRequests();
  }

  async approveRequest(id: string, body: Record<string, unknown>, userId: number) {
    return safeCall(() => this.repo.approveRequest(parseInt(id, 10), userId, body['note']));
  }

  async issueRequest(id: string) {
    return this.repo.issueRequest(parseInt(id, 10));
  }

  async getProduction() {
    return this.repo.getProduction();
  }

  private async productionAction(body: Record<string, unknown>, actionType: string) {
    return this.repo.productionAction(body, actionType);
  }

  takeMaterial(body: Record<string, unknown>) { return this.productionAction(body, 'take'); }
  useMaterial(body: Record<string, unknown>)  { return this.productionAction(body, 'use'); }
  returnMaterial(body: Record<string, unknown>) { return this.productionAction(body, 'return'); }

  async negativeStockCheck() {
    return safeCall(async () => {
      const list = await this.repo.getNegativeStock();
      return { negativeMaterials: list, count: list.ok ? list.data.length : 0 };
    });
  }

  async getHistory(materialId: string, q: Record<string, string>) {
    return safeCall(() => this.repo.getHistory(
      parseInt(materialId, 10),
      q['startDate'] ?? null,
      q['endDate'] ?? null,
    ));
  }

  async getReconciliation(materialId: string) {
    return this.repo.getReconciliation(parseInt(materialId, 10));
  }

  async getByWarehouse(warehouseId: string) {
    return this.repo.getByWarehouse(parseInt(warehouseId, 10));
  }
}
