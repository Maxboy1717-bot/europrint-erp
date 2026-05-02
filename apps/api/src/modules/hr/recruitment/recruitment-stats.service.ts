import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { RecruitmentStatsRepository } from './recruitment-stats.repository';

@Injectable()
export class RecruitmentStatsService {
  private readonly logger = new Logger(RecruitmentStatsService.name);

  constructor(private readonly repo: RecruitmentStatsRepository) {}

  async getWeeklyStatistics(recruiterId: number, weekStart: Date): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`Haftalik rekruting statistikasi so'raldi: recruiterId=${recruiterId}`);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const [stageCountsResult, productivityCountsResult, sourceCountsResult] = await Promise.all([
        this.repo.getStageCounts(recruiterId, weekStart, weekEnd),
        this.repo.getProductivityCounts(recruiterId, weekStart, weekEnd),
        this.repo.getSourceCounts(recruiterId, weekStart, weekEnd),
      ]);

      const stageCounts = (stageCountsResult.ok ? stageCountsResult.data : []) as Array<Record<string, unknown>>;
      const productivityCounts = (productivityCountsResult.ok ? productivityCountsResult.data : []) as Array<Record<string, unknown>>;
      const sourceCounts = (sourceCountsResult.ok ? sourceCountsResult.data : []) as Array<Record<string, unknown>>;

      const getCount = (stage: string) => Number((stageCounts ?? []).find((s) => s['stage'] === stage)?.['cnt'] ?? 0);
      const sourceBreakdown: Record<string, number> = {};
      (sourceCounts ?? []).forEach((s) => { if (s['source']) sourceBreakdown[s['source'] as string] = Number(s['cnt']); });

      const stats = {
        recruiterId, weekStart, weekEnd,
        newCandidates:        getCount('NEW'),
        questionnairesSent:   getCount('QUESTIONNAIRE_SENT'),
        phoneScreeningsDone:  getCount('PHONE_SCREENING'),
        interviewsScheduled:  getCount('INTERVIEW_SCHEDULED'),
        interviewsConducted:  getCount('INTERVIEWED'),
        testsSent:            getCount('TEST_SENT'),
        testAnalysisDone:     getCount('TEST_ANALYSIS'),
        referencesChecked:    getCount('REFERENCES_CHECK'),
        probationStarted:     getCount('PROBATION'),
        offersSent:           getCount('OFFER_SENT'),
        hired:                getCount('HIRED'),
        rejected:             getCount('REJECTED'),
        sourceBreakdown,
        flagmanCount:     Number((productivityCounts ?? []).find((p) => p['category'] === 'FLAGMAN')?.['cnt'] ?? 0),
        protsessnikCount: Number((productivityCounts ?? []).find((p) => p['category'] === 'PROTSESSNIK')?.['cnt'] ?? 0),
        trabldaykerCount: Number((productivityCounts ?? []).find((p) => p['category'] === 'TRABLDAYKER')?.['cnt'] ?? 0),
      };

      const kpiScore = this.calculateKpiScore(stats);
      return { ...stats, kpiScore };
    });
  }

  private calculateKpiScore(stats: { newCandidates: number; phoneScreeningsDone: number; interviewsConducted: number; testAnalysisDone: number; referencesChecked: number; offersSent: number; hired: number; flagmanCount: number }): number {
    const score =
      Math.min(stats.newCandidates * 2, 15) +
      Math.min(stats.phoneScreeningsDone * 3, 15) +
      Math.min(stats.interviewsConducted * 5, 20) +
      Math.min(stats.testAnalysisDone * 3, 10) +
      Math.min(stats.referencesChecked * 4, 10) +
      Math.min(stats.offersSent * 5, 10) +
      Math.min(stats.flagmanCount * 10, 20);
    return Math.min(score, 100);
  }

  async runHrHealthCheck() {
    return safeCall(async () => {
      const thirtyDaysAgo = _time.now();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const checks: Array<{ check: string; passed: boolean; details: string }> = [];

      const [totalNewResult, totalHiredResult, recentFlagmanResult, activeVacanciesResult, recentTestsResult] = await Promise.all([
        this.repo.countTotalNew(),
        this.repo.countTotalHired(),
        this.repo.countRecentFlagmen(thirtyDaysAgo),
        this.repo.countActiveVacancies(),
        this.repo.countRecentTests(thirtyDaysAgo),
      ]);

      const totalNew = (totalNewResult.ok ? totalNewResult.data : { cnt: 0 }) as Record<string, unknown>;
      const totalHired = (totalHiredResult.ok ? totalHiredResult.data : { cnt: 0 }) as Record<string, unknown>;
      const recentFlagman = (recentFlagmanResult.ok ? recentFlagmanResult.data : { cnt: 0 }) as Record<string, unknown>;
      const activeVacancies = (activeVacanciesResult.ok ? activeVacanciesResult.data : { cnt: 0 }) as Record<string, unknown>;
      const recentTests = (recentTestsResult.ok ? recentTestsResult.data : { cnt: 0 }) as Record<string, unknown>;

      const conversionRate = Number(totalNew['cnt']) > 0 ? (Number(totalHired['cnt']) / Number(totalNew['cnt'])) * 100 : 0;
      checks.push({ check: 'Funnel konversiyasi ≥ 5%', passed: conversionRate >= 5, details: `Hozirgi konversiya: ${conversionRate.toFixed(1)}% (${totalHired['cnt']} / ${totalNew['cnt']})` });
      checks.push({ check: 'Oxirgi 30 kunda ≥ 1 ta Flagman yollandi', passed: Number(recentFlagman['cnt']) >= 1, details: `Oxirgi 30 kunda yollangan Flagmanlar: ${recentFlagman['cnt']}` });
      checks.push({ check: 'Aktiv vakansiyalar mavjud', passed: Number(activeVacancies['cnt']) > 0, details: `Hozirda ochiq vakansiyalar: ${activeVacancies['cnt']}` });
      checks.push({ check: 'Tool Test ishlatilmoqda (oxirgi 30 kun)', passed: Number(recentTests['cnt']) >= 3, details: `Oxirgi 30 kunda o'tkazilgan Tool Testlar: ${recentTests['cnt']}` });

      const passedCount = (Array.isArray(checks) ? checks : []).filter((c) => c.passed).length;
      const score = Math.round((passedCount / checks.length) * 100);
      return { score, passedCount, totalChecks: checks.length, checks, status: score >= 80 ? 'HEALTHY' : score >= 50 ? 'MODERATE' : 'CRITICAL' };
    });
  }

  async getChannelAnalytics() {
    return safeCall(async () => {
      const rowsResult = await this.repo.getChannelAnalytics();
      const rows = (rowsResult.ok ? rowsResult.data : []) as Array<Record<string, unknown>>;
      return { data: (rows ?? []).map((r) => ({ ...r, ch_key: ((r['ch_key'] as string | null) ?? 'UNKNOWN').toUpperCase() })) };
    });
  }
}
