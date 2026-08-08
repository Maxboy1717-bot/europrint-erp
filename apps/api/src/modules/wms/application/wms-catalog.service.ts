/**
 * @module wms-catalog.service
 * @description Warehouse analytics facade — implementation split into
 *   ./wms-catalog/ sub-services to satisfy Rule 16. External consumers
 *   continue using WmsCatalogService.
 *
 * @layer Application Service (WMS)
 */

import { Injectable } from '@nestjs/common';
import { WmsCatalogAbcAgingExpiryService } from './wms-catalog/abc-aging-expiry.service';
import { WmsCatalogStockTurnoverService } from './wms-catalog/stock-turnover.service';
import { WmsCatalogDashboardService } from './wms-catalog/dashboard.service';

export { WmsCatalogAbcAgingExpiryService, WmsCatalogStockTurnoverService, WmsCatalogDashboardService };

@Injectable()
export class WmsCatalogService {
  constructor(
    private readonly abc: WmsCatalogAbcAgingExpiryService,
    private readonly stock: WmsCatalogStockTurnoverService,
    private readonly dash: WmsCatalogDashboardService,
  ) {}

  // ── REPORTS ─────────────────────────────────────────────────────────────
  getAbcAnalysis  = () => this.abc.getAbcAnalysis();
  getAging        = (days: number) => this.abc.getAging(days);
  getExpiry       = (days: number) => this.abc.getExpiry(days);
  getStockBalance = (wh?: string, cat?: string, low = false) => this.stock.getStockBalance(wh, cat, low);
  getTurnover     = (dateFrom?: string, dateTo?: string) => this.stock.getTurnover(dateFrom, dateTo);
  getTopMaterials = (limit: number) => this.stock.getTopMaterials(limit);

  // ── STATS / DASHBOARD ───────────────────────────────────────────────────
  getStatsTotal       = () => this.dash.getStatsTotal();
  getDashboardKpis    = () => this.dash.getDashboardKpis();
  getMovementSummary  = (p?: string) => this.dash.getMovementSummary(p);
  getDashboardAlerts  = () => this.dash.getDashboardAlerts();
}
