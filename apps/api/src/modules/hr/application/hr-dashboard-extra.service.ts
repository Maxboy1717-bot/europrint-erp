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

/**
 * i18n for `GET /hr/resignation-stats/:lang` (previously the `:lang` param was silently
 * ignored — the base and `/:lang` routes returned byte-identical payloads regardless of
 * language, see hr-dashboard-deep-audit-2026-05-28.md line ~70/108). `dismissal_type` is a
 * CONTROLLED enum (validated in offboarding-workflow.service.ts#validateDismissalType — not
 * free text), so translating the known codes is safe. Unknown/legacy codes fall back to the
 * raw stored string (no fabrication).
 */
export type SupportedLang = 'uz' | 'uz-cyr' | 'ru';

function normalizeLang(lang?: string): SupportedLang {
  return lang === 'ru' || lang === 'uz-cyr' ? lang : 'uz';
}

const RESIGNATION_REASON_LABELS: Record<string, Record<SupportedLang, string>> = {
  voluntary:       { uz: "O'z xohishi bilan",        'uz-cyr': 'Ўз хоҳиши билан',        ru: 'По собственному желанию' },
  resignation:     { uz: "O'z xohishi bilan",        'uz-cyr': 'Ўз хоҳиши билан',        ru: 'По собственному желанию' },
  termination:     { uz: "Ishdan bo'shatish",         'uz-cyr': 'Ишдан бўшатиш',          ru: 'Увольнение по инициативе компании' },
  retirement:      { uz: 'Pensiyaga chiqish',          'uz-cyr': 'Пенсияга чиқиш',         ru: 'Выход на пенсию' },
  end_of_contract: { uz: "Shartnoma muddati tugashi",  'uz-cyr': 'Шартнома муддати тугаши', ru: 'Истечение срока контракта' },
  mutual:          { uz: "O'zaro kelishuv",           'uz-cyr': 'Ўзаро келишув',          ru: 'По соглашению сторон' },
  other:           { uz: 'Boshqa sabab',               'uz-cyr': 'Бошқа сабаб',            ru: 'Другая причина' },
};

const NO_DATA_LABEL: Record<SupportedLang, string> = {
  uz: "Ma'lumot yo'q", 'uz-cyr': 'Маълумот йўқ', ru: 'Нет данных',
};

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

  async getContractsProjected(page: number, limit: number): Promise<Result<{
    id: unknown; fullName: string; contractNumber: string; contractType: string;
    startDate: string; endDate: string; status: string; daysLeft: number;
  }[], AppError>> {
    const r = await this.repo.getContracts(page, limit);
    if (!r.ok) return r as Result<never, AppError>;
    const rows = (Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    return Ok(rows.map(row => ({
      id:             row.id,
      fullName:       String(row.full_name ?? ''),
      contractNumber: String(row.contract_number ?? ''),
      contractType:   String(row.contract_type ?? ''),
      startDate:      String(row.start_date ?? ''),
      endDate:        String(row.end_date ?? ''),
      status:         String(row.status ?? ''),
      daysLeft:       Number(row.days_left ?? 0),
    })));
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

  async getResignationStatsProjected(lang?: string): Promise<Result<ResignationStatsRow[], AppError>> {
    const l = normalizeLang(lang);
    const r = await this.repo.getResignationStats();
    if (!r.ok) return r as Result<never, AppError>;
    const rows = (Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    if (rows.length === 0) {
      return Ok([{ reason: NO_DATA_LABEL[l], count: 0, color: COLORS[0] ?? '#94a3b8' }]);
    }
    return Ok(rows.map((row, i) => {
      const code = String(row.reason ?? 'other');
      return {
        reason: RESIGNATION_REASON_LABELS[code]?.[l] ?? code,
        count: Number(row.count),
        color: COLORS[i % COLORS.length] ?? '#94a3b8',
      };
    }));
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
    const [summaryR, kpisR] = await Promise.all([
      this.repo.getSafetySummary(),
      this.repo.getSafetyKpis(),
    ]);
    const row = (summaryR.ok ? summaryR.data : null) as Record<string, unknown> | null;
    const kpis = kpisR.ok ? kpisR.data : { ppeCompliancePercent: 0, expiringTrainings: 0 };
    return Ok({
      incidentsThisMonth:   Number(row?.this_month ?? 0),
      ppeCompliancePercent: kpis.ppeCompliancePercent,
      expiringTrainings:    kpis.expiringTrainings,
      openIncidents:        Number(row?.open_count ?? 0),
    });
  }

  async getSafetyOverview(): Promise<Result<SafetyOverview, AppError>> {
    return safeCall(async () => {
      const [incidentsR, summaryR, kpisR] = await Promise.allSettled([
        this.repo.getSafetyIncidents(),
        this.repo.getSafetySummary(),
        this.repo.getSafetyKpis(),
      ]);
      const incV = incidentsR.status === 'fulfilled' ? incidentsR.value : null;
      const incidents = (incV?.ok && Array.isArray(incV.data) ? incV.data : []) as Record<string, unknown>[];
      const sumV = summaryR.status === 'fulfilled' ? summaryR.value : null;
      const summary = (sumV?.ok ? sumV.data : null) as Record<string, unknown> | null;
      const kpisV = kpisR.status === 'fulfilled' ? kpisR.value : null;
      const kpis = kpisV?.ok ? kpisV.data : { ppeCompliancePercent: 0, expiringTrainings: 0 };
      return {
        incidents: incidents.slice(0, 5),
        summary: {
          incidentsThisMonth:   Number(summary?.this_month ?? 0),
          openIncidents:        Number(summary?.open_count ?? 0),
          ppeCompliancePercent: kpis.ppeCompliancePercent,
          expiringTrainings:    kpis.expiringTrainings,
        },
      };
    });
  }
}
