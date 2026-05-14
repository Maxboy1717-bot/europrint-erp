/**
 * @module financial-reports.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import {
  kassaTransactions,
  omborQoldiq,
  debitorlar,
  kreditorlar,
  balans,
  ishlabChiqarish,
} from '@europrint/schemas';
import type {
  CashSummary,
  WarehouseBalance,
  AgingBucket,
  BalanceSheet,
  ProductionMetrics,
} from '../services/financial-reports-query.service';

@Injectable()
export class FinancialReportsRepository {
  private readonly logger = new Logger(FinancialReportsRepository.name);

  async saveKassa(date: string, d: CashSummary): Promise<void> {
    try {
      await db.insert(kassaTransactions)
        .values({
          id:             `kassa-${date}`,
          reportDate:     date,
          totalInflow:    String(d.totalInflow),
          totalOutflow:   String(d.totalOutflow),
          netCashFlow:    String(d.netCashFlow),
          openingBalance: String(d.openingBalance),
          closingBalance: String(d.closingBalance),
        })
        .onConflictDoNothing();
    } catch (e) {
      this.logger.error(`saveKassa error: ${String(e)}`);
    }
  }

  async saveOmbor(date: string, d: WarehouseBalance): Promise<void> {
    try {
      await db.insert(omborQoldiq)
        .values({
          id:              `ombor-${date}`,
          reportDate:      date,
          totalItems:      d.totalItems,
          totalQuantity:   String(d.totalQuantity),
          totalValue:      String(d.totalValue),
          averageValue30d: String(d.averageValue30d),
          overstockFlag:   d.totalValue > d.averageValue30d * 1.2 && d.averageValue30d > 0 ? 'warning' : 'normal',
        })
        .onConflictDoNothing();
    } catch (e) {
      this.logger.error(`saveOmbor error: ${String(e)}`);
    }
  }

  async saveDebitors(date: string, items: AgingBucket[]): Promise<void> {
    if (items.length === 0) return;
    try {
      await db.insert(debitorlar)
        .values(items.map((item, i) => ({
          id:              `debitor-${date}-${i}`,
          reportDate:      date,
          customerId:      item.entityId as number | undefined,
          customerName:    item.entityName,
          totalReceivable: String(item.total),
          current:         String(item.current),
          overdue30:       String(item.overdue30),
          overdue60:       String(item.overdue60),
          overdue90plus:   String(item.overdue90plus),
        })))
        .onConflictDoNothing();
    } catch (e) {
      this.logger.error(`saveDebitors error: ${String(e)}`);
    }
  }

  async saveCreditors(date: string, items: AgingBucket[]): Promise<void> {
    if (items.length === 0) return;
    try {
      await db.insert(kreditorlar)
        .values(items.map((item, i) => ({
          id:           `kreditor-${date}-${i}`,
          reportDate:   date,
          vendorId:     item.entityId as number | undefined,
          vendorName:   item.entityName,
          totalPayable: String(item.total),
          current:      String(item.current),
          overdue30:    String(item.overdue30),
          overdue60:    String(item.overdue60),
          overdue90plus: String(item.overdue90plus),
        })))
        .onConflictDoNothing();
    } catch (e) {
      this.logger.error(`saveCreditors error: ${String(e)}`);
    }
  }

  async saveBalans(date: string, d: BalanceSheet): Promise<void> {
    try {
      await db.insert(balans)
        .values({
          id:                    `balans-${date}`,
          reportDate:            date,
          totalAssets:           String(d.totalAssets),
          currentAssets:         String(d.currentAssets),
          nonCurrentAssets:      String(d.nonCurrentAssets),
          totalLiabilities:      String(d.totalLiabilities),
          currentLiabilities:    String(d.currentLiabilities),
          nonCurrentLiabilities: String(d.nonCurrentLiabilities),
          equity:                String(d.equity),
          retainedEarnings:      String(d.retainedEarnings),
        })
        .onConflictDoNothing();
    } catch (e) {
      this.logger.error(`saveBalans error: ${String(e)}`);
    }
  }

  async saveIshlab(date: string, d: ProductionMetrics): Promise<void> {
    try {
      await db.insert(ishlabChiqarish)
        .values({
          id:              `ishlab-${date}`,
          reportDate:      date,
          plannedQuantity: String(d.plannedQuantity),
          actualQuantity:  String(d.actualQuantity),
          goodQuantity:    String(d.goodQuantity),
          scrapQuantity:   String(d.scrapQuantity),
          efficiencyPct:   String(d.efficiencyPct),
          scrapRatePct:    String(d.scrapRatePct),
          downtimeMinutes: d.downtimeMinutes,
        })
        .onConflictDoNothing();
    } catch (e) {
      this.logger.error(`saveIshlab error: ${String(e)}`);
    }
  }
}
