/**
 * @module qc-dispatch-conclusion.service
 * @description Business-logic service. Returns Result<T>; derives verdict/defect-rate and
 * delegates all DB access to the repository (Qoida 15). Vision 09-qc #26.
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  QcDispatchConclusionRepository,
  QcOrderAggregate,
} from '../infrastructure/repositories/qc-dispatch-conclusion.repository';

/** Percent conversion base for the defect-rate (nuqson foizi). */
const PERCENT_BASE = 100;

type Row = Record<string, unknown>;

@Injectable()
export class QcDispatchConclusionService {
  constructor(private readonly repo: QcDispatchConclusionRepository) {}

  /**
   * Vision 09-qc#26 — per-partial-shipment conclusion: recorded when a dispatch (delivery)
   * is confirmed for a still-open PP order. A snapshot of the order's QC state at dispatch time.
   */
  async recordDispatchConclusion(
    productionOrderId: number,
    deliveryId: number,
    concludedBy: number | null,
  ): Promise<Result<Row>> {
    if (!Number.isInteger(productionOrderId) || productionOrderId <= 0) {
      return Err(AppErr('VALIDATION', "productionOrderId musbat butun son bo'lishi kerak"));
    }
    if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
      return Err(AppErr('VALIDATION', "deliveryId musbat butun son bo'lishi kerak (dispatch xulosasi uchun majburiy)"));
    }
    return this._record(productionOrderId, deliveryId, 'dispatch', concludedBy);
  }

  /**
   * Vision 09-qc#26 — final PP-close conclusion: the single cumulative summary written when the
   * production order transitions to "Yopildi". Stored with delivery_id NULL (the "+1" of N+1).
   */
  async recordFinalConclusion(
    productionOrderId: number,
    concludedBy: number | null,
  ): Promise<Result<Row>> {
    if (!Number.isInteger(productionOrderId) || productionOrderId <= 0) {
      return Err(AppErr('VALIDATION', "productionOrderId musbat butun son bo'lishi kerak"));
    }
    return this._record(productionOrderId, null, 'final', concludedBy);
  }

  /** List the N+1 conclusions for one production order. */
  async getConclusions(productionOrderId: number): Promise<Result<Row[]>> {
    if (!Number.isInteger(productionOrderId) || productionOrderId <= 0) {
      return Err(AppErr('VALIDATION', "productionOrderId musbat butun son bo'lishi kerak"));
    }
    return this.repo.findByProductionOrder(productionOrderId);
  }

  private async _record(
    productionOrderId: number,
    deliveryId: number | null,
    conclusionType: 'dispatch' | 'final',
    concludedBy: number | null,
  ): Promise<Result<Row>> {
    const aggRes = await this.repo.aggregateOrderQc(productionOrderId);
    if (!aggRes.ok) return Err(aggRes.error);
    const agg = aggRes.data;

    const { defectRate, verdict } = this._deriveVerdict(agg);
    const summary = {
      source: 'qc_inspections',
      inspectionCount: agg.inspectionCount,
      deliveryId,
      conclusionType,
    };

    return this.repo.insertConclusion({
      productionOrderId,
      deliveryId,
      conclusionType,
      totalInspected: agg.totalInspected,
      totalPassed: agg.totalPassed,
      totalDefects: agg.totalDefects,
      defectRate,
      verdict,
      summary,
      concludedBy,
    });
  }

  /** Pure verdict / defect-rate derivation from the aggregated QC counts. */
  private _deriveVerdict(agg: QcOrderAggregate): { defectRate: number | null; verdict: string } {
    if (agg.totalInspected <= 0) {
      return { defectRate: null, verdict: 'pending' };
    }
    const defectRate = Number(((agg.totalDefects / agg.totalInspected) * PERCENT_BASE).toFixed(2));
    const verdict = agg.totalDefects === 0 ? 'passed' : 'failed';
    return { defectRate, verdict };
  }
}
