/**
 * @module rush-orders.service
 * @description GET /ai/rush-orders + POST /ai/rush-orders/:id/approve + POST
 *   /ai/rush-orders/:id/reject (owner 2026-07-13, chat). Replaces 3 hard-gated
 *   501 stubs previously in ai.controller.ts. FE reference (built ahead of
 *   backend): artifacts/erp-dashboard/src/pages/ai-planning/RushOrderPage.tsx.
 *
 *   Qualification rule: an order qualifies as "rush" when its requested delivery date is
 *   within N days of order creation (N = business_settings 'rush_order_max_lead_days').
 *   Surcharge %, the "standard" comparison lead time, and the feasibility-scoring weights
 *   are ALL owner-tunable the same way (Q-40) — none hardcoded here, every number is read
 *   via getBusinessSettingNumber(key, fallback), same pattern as
 *   sd-quotations.service.ts's full_advance_discount_pct and the sibling
 *   demand-forecast.service.ts's ai.forecast_min_orders (both built this same session). The
 *   DEFAULT_* constants below are clearly-labeled placeholders pending owner tuning through
 *   the Business Settings CRUD screen, not researched/invented "correct" business numbers.
 *
 *   Feasibility score (0-100, FE thresholds FEASIBILITY_HIGH=70 / FEASIBILITY_LOW=40) is a
 *   real first-pass calculation from two components actually queryable today, weighted by
 *   rush_order_feasibility_weight_load_pct:
 *     - load component: current shop load, 100 minus (open production_orders ÷ active
 *       work_centers) × rush_order_load_penalty_per_order. Fewer open orders per active
 *       machine → more spare capacity → higher feasibility.
 *     - margin component: how much of the N-day rush window is left for THIS order —
 *       (requested lead days ÷ N) × 100. A same-day rush request scores near 0 here; a
 *       request right at the N-day boundary scores near 100.
 *   This is intentionally simple (no routing/BOM/crew-level CRP — that exists in
 *   pp/domain/services/crp.service.ts for a deeper per-work-center analysis but needs
 *   setup/run-time inputs this endpoint does not have) — a real, defensible starting point
 *   the owner can refine later, not a placeholder random number.
 *
 *   Persistence: rush_order_requests (one row per order_id — see migration
 *   apps/api/src/shared/db/migrations/rush-orders-2026-07-13.sql). GET returns orders that
 *   either already have a row (current status) or currently qualify and don't yet
 *   ("virtual" pending_approval, computed live). approve()/reject() create the row on first
 *   decision (snapshotting the settings/score used at that moment) or transition an existing
 *   pending_approval row — an already-decided row cannot be re-decided (409 CONFLICT).
 * @layer Application Service (AI module)
 */

import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Result, safeCall } from '@common/result';
import { clamp, safeDiv, safeNum } from '@common/math/math-utils';
import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import {
  DrizzleRushOrdersRepo,
  RushOrderCandidateRow,
  RushOrderRequestRow,
  RushOrderStatus,
} from '../../infrastructure/repositories/drizzle-rush-orders.repo';

/** Placeholder default (business_settings 'rush_order_max_lead_days') — days between order
 *  creation and requested delivery for an order to qualify as "rush". Owner-tunable. */
const DEFAULT_MAX_LEAD_DAYS = 3;
/** Placeholder default (business_settings 'rush_order_surcharge_pct') — extra % charged on a
 *  rush order. Owner-tunable. */
const DEFAULT_SURCHARGE_PCT = 20;
/** Placeholder default (business_settings 'rush_order_standard_lead_days') — the "normal"
 *  lead time shown next to the rush lead time for FE comparison. Owner-tunable. */
const DEFAULT_STANDARD_LEAD_DAYS = 14;
/** Placeholder default (business_settings 'rush_order_load_penalty_per_order') — feasibility
 *  points deducted per open-production-order-per-active-work-center ratio. Owner-tunable. */
const DEFAULT_LOAD_PENALTY_PER_ORDER = 5;
/** Placeholder default (business_settings 'rush_order_feasibility_weight_load_pct') — 0-100
 *  weight given to the load component of the feasibility score; the rest goes to the
 *  lead-time-margin component. Owner-tunable. */
const DEFAULT_FEASIBILITY_WEIGHT_LOAD_PCT = 50;
/** Neutral fallback feasibility-load-component score used only if the capacity signal query
 *  itself fails — this endpoint is advisory, never blocking, so a DB hiccup degrades to a
 *  mid-range score rather than throwing. */
const NEUTRAL_LOAD_SCORE = 50;

export interface RushOrderDto {
  orderId: number;
  orderNumber: string;
  customerName: string;
  requestedDate: string;
  standardLeadDays: number;
  rushLeadDays: number;
  rushSurchargePct: number;
  feasibilityScore: number;
  status: RushOrderStatus;
}

interface RushOrderSettings {
  maxLeadDays: number;
  surchargePct: number;
  standardLeadDays: number;
  loadPenaltyPerOrder: number;
  weightLoadPct: number;
}

@Injectable()
export class RushOrdersService {
  private readonly logger = new Logger(RushOrdersService.name);

  constructor(private readonly repo: DrizzleRushOrdersRepo) {}

  async listRushOrders(): Promise<Result<{ items: RushOrderDto[] }>> {
    return safeCall(async () => {
      const settings = await this.readSettings();
      const candidatesR = await this.repo.listCandidates(settings.maxLeadDays);
      if (!candidatesR.ok) throw new Error(candidatesR.error.message);

      const loadScore = await this.getLoadScore(settings.loadPenaltyPerOrder);
      const items = candidatesR.data.map((row) => this.toDto(row, settings, loadScore));
      return { items };
    });
  }

  async approve(orderId: number, userId: number): Promise<Result<RushOrderDto>> {
    return this.decide(orderId, userId, 'approved', null);
  }

  async reject(orderId: number, userId: number, reason: string | null): Promise<Result<RushOrderDto>> {
    return this.decide(orderId, userId, 'rejected', reason);
  }

  /** Shared approve/reject flow: transition an existing pending_approval row, or create the
   *  first decision row for a still-qualifying, not-yet-tracked order. */
  private async decide(
    orderId: number,
    userId: number,
    status: Extract<RushOrderStatus, 'approved' | 'rejected'>,
    rejectedReason: string | null,
  ): Promise<Result<RushOrderDto>> {
    return safeCall(async () => {
      const existingR = await this.repo.getRequestByOrderId(orderId);
      if (!existingR.ok) throw new Error(existingR.error.message);

      if (existingR.data) {
        if (existingR.data.status !== 'pending_approval') {
          throw new ConflictException(
            `Rush buyurtma allaqachon "${existingR.data.status}" holatida — qayta tasdiqlash/rad etish mumkin emas`,
          );
        }
        const updatedR = await this.repo.updateStatus(existingR.data.id, orderId, status, {
          approvedBy: status === 'approved' ? userId : null,
          approvedAt: status === 'approved' ? new Date() : null,
          rejectedReason: status === 'rejected' ? rejectedReason : null,
        });
        if (!updatedR.ok) throw new Error(updatedR.error.message);
        return this.snapshotToDto(updatedR.data);
      }

      // No tracked decision yet — the order must currently qualify to be decided on directly
      // (mirrors GET's own qualification gate, so approve/reject can never fabricate a
      // feasibility score for an order that was never actually a rush candidate).
      const settings = await this.readSettings();
      const orderR = await this.repo.getOrderBasicInfo(orderId);
      if (!orderR.ok) throw new Error(orderR.error.message);
      if (!orderR.data) throw new NotFoundException('Buyurtma topilmadi');

      const leadDays = orderR.data.computedLeadDays;
      if (leadDays == null || leadDays < 0 || leadDays > settings.maxLeadDays) {
        throw new BadRequestException(
          `Bu buyurtma rush (tezkor) shartiga mos kelmaydi — talab qilingan yetkazib berish sanasi ` +
          `buyurtma yaratilgan kundan ${settings.maxLeadDays} kundan ko'p yoki noma'lum.`,
        );
      }

      const loadScore = await this.getLoadScore(settings.loadPenaltyPerOrder);
      const marginScore = this.computeMarginScore(leadDays, settings.maxLeadDays);
      const feasibilityScore = this.computeFeasibility(loadScore, marginScore, settings.weightLoadPct);

      const createdR = await this.repo.insertRequest({
        orderId,
        requestedBy: userId,
        standardLeadDays: settings.standardLeadDays,
        rushLeadDays: leadDays,
        surchargePct: settings.surchargePct,
        feasibilityScore,
        status,
        approvedBy: status === 'approved' ? userId : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectedReason: status === 'rejected' ? rejectedReason : null,
      });
      if (!createdR.ok) throw new Error(createdR.error.message);
      return this.snapshotToDto(createdR.data);
    });
  }

  private async readSettings(): Promise<RushOrderSettings> {
    const [maxLeadDays, surchargePct, standardLeadDays, loadPenaltyPerOrder, weightLoadPct] = await Promise.all([
      getBusinessSettingNumber('rush_order_max_lead_days', DEFAULT_MAX_LEAD_DAYS),
      getBusinessSettingNumber('rush_order_surcharge_pct', DEFAULT_SURCHARGE_PCT),
      getBusinessSettingNumber('rush_order_standard_lead_days', DEFAULT_STANDARD_LEAD_DAYS),
      getBusinessSettingNumber('rush_order_load_penalty_per_order', DEFAULT_LOAD_PENALTY_PER_ORDER),
      getBusinessSettingNumber('rush_order_feasibility_weight_load_pct', DEFAULT_FEASIBILITY_WEIGHT_LOAD_PCT),
    ]);
    return { maxLeadDays, surchargePct, standardLeadDays, loadPenaltyPerOrder, weightLoadPct };
  }

  /** 100 minus (open production_orders ÷ active work_centers) × penalty-per-order, clamped
   *  0-100. Falls back to a neutral mid-range score if the capacity query itself errors —
   *  this signal is advisory, never blocking. */
  private async getLoadScore(loadPenaltyPerOrder: number): Promise<number> {
    const capacityR = await this.repo.getCapacitySignal();
    if (!capacityR.ok) {
      this.logger.warn(`Rush-order capacity signal unavailable, using neutral fallback: ${capacityR.error.message}`);
      return NEUTRAL_LOAD_SCORE;
    }
    const { openProductionOrders, activeWorkCenters } = capacityR.data;
    const ordersPerWorkCenter = activeWorkCenters > 0 ? safeDiv(openProductionOrders, activeWorkCenters) : openProductionOrders;
    return Math.round(clamp(100 - ordersPerWorkCenter * loadPenaltyPerOrder, 0, 100));
  }

  /** (leadDays ÷ maxLeadDays) × 100, clamped 0-100 — how much of the rush window remains. */
  private computeMarginScore(leadDays: number, maxLeadDays: number): number {
    if (maxLeadDays <= 0) return 100;
    return Math.round(clamp(safeDiv(leadDays, maxLeadDays) * 100, 0, 100));
  }

  private computeFeasibility(loadScore: number, marginScore: number, weightLoadPct: number): number {
    const w = clamp(weightLoadPct, 0, 100) / 100;
    return Math.round(clamp(loadScore * w + marginScore * (1 - w), 0, 100));
  }

  private toDto(row: RushOrderCandidateRow, settings: RushOrderSettings, loadScore: number): RushOrderDto {
    // Already-decided (or currently-pending-and-tracked) row: use the persisted snapshot so
    // a later business_settings tuning change never silently rewrites an audit trail.
    if (row.requestId != null && row.status != null) {
      return {
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        requestedDate: row.requestedDeliveryDate ?? '',
        standardLeadDays: row.standardLeadDays ?? settings.standardLeadDays,
        rushLeadDays: row.rushLeadDays ?? 0,
        rushSurchargePct: safeNum(row.surchargePct, settings.surchargePct),
        feasibilityScore: row.feasibilityScore ?? 0,
        status: row.status,
      };
    }

    // Virtual candidate — not yet tracked, computed live from current settings.
    const rushLeadDays = row.computedLeadDays ?? 0;
    const marginScore = this.computeMarginScore(rushLeadDays, settings.maxLeadDays);
    const feasibilityScore = this.computeFeasibility(loadScore, marginScore, settings.weightLoadPct);
    return {
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      requestedDate: row.requestedDeliveryDate ?? '',
      standardLeadDays: settings.standardLeadDays,
      rushLeadDays,
      rushSurchargePct: settings.surchargePct,
      feasibilityScore,
      status: 'pending_approval',
    };
  }

  private snapshotToDto(row: RushOrderRequestRow): RushOrderDto {
    return {
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      requestedDate: row.requestedDeliveryDate ?? '',
      standardLeadDays: row.standardLeadDays,
      rushLeadDays: row.rushLeadDays,
      rushSurchargePct: safeNum(row.surchargePct),
      feasibilityScore: row.feasibilityScore,
      status: row.status,
    };
  }
}
