/**
 * @module hr-dashboard-extra.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Rule 6 (controller transport-only): the projections + stats roll-ups that
 * the FE consumes (chart-ready arrays, risk-bucket counts, safety overview
 * combo) live here, not in the controller. The controller only validates
 * input, awaits the service, and returns the unwrapped payload.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Ok, Err, AppErr } from '@common/result';
import { HR_DASHBOARD_EXTRA_REPO, type IHrDashboardExtraRepo } from '../domain/repositories/i-hr-dashboard-extra.repo';

/** Palette used by the FE pie/bar charts. Five distinct hues. */
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C7B3E0'];

export interface ResignationStatsRow {
  reason: string;
  count: number;
  color: string;
}

export interface RiskScoresPayload {
  scores: {
    id: string;
    fullName: string;
    departmentName: string;
    positionName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    overallScore: number;
    factors: Record<string, number>;
  }[];
  stats: { low: number; medium: number; high: number; critical: number };
}

export interface SafetySummary {
  incidentsThisMonth: number;
  ppeCompliancePercent: number;
  expiringTrainings: number;
  openIncidents: number;
}

export interface SafetyOverview {
  incidents: Record<string, unknown>[];
  summary: SafetySummary;
}

@Injectable()
export class HrDashboardExtraService {
  constructor(@Inject(HR_DASHBOARD_EXTRA_REPO) private readonly repo: IHrDashboardExtraRepo) {}

  /** Pass-through repo accessors (kept for callers that need raw rows). */
  async getResignationStatsRaw(): Promise<Result<object, AppError>> {
    return this.repo.getResignationStats();
  }
  async getRiskScoresRaw() {
    return this.repo.getRiskScores();
  }
  async getSafetySummaryRaw() {
    return this.repo.getSafetySummary();
  }
  async getSafetyIncidentsRaw() {
    return this.repo.getSafetyIncidents();
  }
  async getOffboardingStats() {
    return this.repo.getOffboardingStats();
  }
  async getContractsExpiring(days: number) {
    return this.repo.getContractsExpiring(days);
  }

  async getContractsExpiringProjected(days: number): Promise<Result<{
    id: unknown; fullName: string; contractNumber: string;
    endDate: string; daysLeft: number; urgency: 'critical' | 'warning' | 'info';
  }[], AppError>> {
    const r = await this.repo.getContractsExpiring(days);
    if (!r.ok) return r as Result<never, AppError>;
    const rows = (Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    return Ok(rows.map(row => {
      const dl = Number(row.days_left ?? 0);
      return {
        id:             row.id,
        fullName:       String(row.full_name ?? ''),
        contractNumber: String(row.contract_number ?? ''),
        endDate:        String(row.end_date ?? ''),
        daysLeft:       dl,
        urgency:        (dl <= 7 ? 'critical' : dl <= 15 ? 'warning' : 'info') as 'critical' | 'warning' | 'info',
      };
    }));
  }

  // ─── Back-compat aliases (legacy callers) ────────────────────────────────
  async getResignationStats(): Promise<Result<object, AppError>> {
    return this.repo.getResignationStats();
  }
  async getRiskScores() {
    return this.repo.getRiskScores();
  }
  async getSafetySummary() {
    return this.repo.getSafetySummary();
  }
  async getSafetyIncidents() {
    return this.repo.getSafetyIncidents();
  }

  // ─── Projected views (Rule 6 — moved out of controllers) ─────────────────

  async getResignationStatsProjected(): Promise<Result<ResignationStatsRow[], AppError>> {
    const r = await this.repo.getResignationStats();
    if (!r.ok) return r as Result<never, AppError>;
    const rows = (Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    if (rows.length === 0) {
      return Ok([{ reason: "Ma'lumot yo'q", count: 0, color: COLORS[0] ?? '#94a3b8' }]);
    }
    return Ok(rows.map((row, i) => ({
      reason: String(row.reason),
      count: Number(row.count),
      color: COLORS[i % COLORS.length] ?? '#94a3b8',
    })));
  }

  async getRiskScoresProjected(): Promise<Result<RiskScoresPayload, AppError>> {
    const r = await this.repo.getRiskScores();
    if (!r.ok) return r as Result<never, AppError>;
    const rows = (Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    const scores = rows.map(row => ({
      id: String(row.id ?? ''),
      fullName: String(row.full_name ?? ''),
      departmentName: String(row.department_name ?? ''),
      positionName: String(row.position_name ?? ''),
      riskLevel: String(row.risk_level ?? 'low') as 'low' | 'medium' | 'high' | 'critical',
      overallScore: Number(row.overall_score ?? 0),
      factors: {} as Record<string, number>,
    }));
    const stats = {
      low:      scores.filter(s => s.riskLevel === 'low').length,
      medium:   scores.filter(s => s.riskLevel === 'medium').length,
      high:     scores.filter(s => s.riskLevel === 'high').length,
      critical: scores.filter(s => s.riskLevel === 'critical').length,
    };
    return Ok({ scores, stats });
  }

  async getSafetySummaryProjected(): Promise<Result<SafetySummary, AppError>> {
    const r = await this.repo.getSafetySummary();
    const row = (r.ok ? r.data : null) as Record<string, unknown> | null;
    return Ok({
      incidentsThisMonth:   Number(row?.this_month ?? 0),
      ppeCompliancePercent: 0,
      expiringTrainings:    0,
      openIncidents:        Number(row?.open_count ?? 0),
    });
  }

  async getSafetyOverview(): Promise<Result<SafetyOverview, AppError>> {
    return safeCall(async () => {
      const [incidentsR, summaryR] = await Promise.allSettled([
        this.repo.getSafetyIncidents(),
        this.repo.getSafetySummary(),
      ]);
      const incV = incidentsR.status === 'fulfilled' ? incidentsR.value : null;
      const incidents = (incV?.ok && Array.isArray(incV.data) ? incV.data : []) as Record<string, unknown>[];
      const sumV = summaryR.status === 'fulfilled' ? summaryR.value : null;
      const summary = (sumV?.ok ? sumV.data : null) as Record<string, unknown> | null;
      return {
        incidents: incidents.slice(0, 5),
        summary: {
          incidentsThisMonth:   Number(summary?.this_month ?? 0),
          openIncidents:        Number(summary?.open_count ?? 0),
          ppeCompliancePercent: 0,
          expiringTrainings:    0,
        },
      };
    });
  }
}
