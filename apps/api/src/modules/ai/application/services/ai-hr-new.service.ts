/**
 * @module ai-hr-new.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { DrizzleAiHrNewRepo } from '../../infrastructure/repositories/drizzle-ai-hr-new.repo';
import { AiRouterService } from './ai-router.service';
import { CreateAiInterviewDtoSchema } from '../../presentation/dto/ai-hr-new.dto';
import { z } from 'zod';
import {
  AiHrDashboardData,
  AiProviderConfig,
  AiBudgetItem,
} from '../../presentation/dto/ai-hr-new.dto';

import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import { AiRequest, AiTaskType } from '../../domain/types/ai.types';
type CreateDto = z.infer<typeof CreateAiInterviewDtoSchema>;

// P1.7.3 (2026-07-13 revision, HR AI Dashboard budget fix): these were previously a
// static PROVIDER_BUDGETS array built from app.constants.ts values -- and two of the
// three "dailyRequestLimit" numbers were unrelated constants reused by numeric
// coincidence (MAX_EXPORT_LIMIT -- an export row-count cap used elsewhere by WMS -- as
// OpenAI's daily AI-request limit; AI_SHORT_MAX_TOKENS -- a per-call token cap used
// elsewhere by CRM/finance AI services -- as Claude's daily AI-request limit). Q-12/Q-40:
// no hardcoded business threshold; every number is now read via
// getBusinessSettingNumber(key, fallback), same pattern as ai.forecast_min_orders
// (demand-forecast.service.ts) and rush_order_* (rush-orders.service.ts). The DEFAULT_*
// constants below are placeholders IDENTICAL to the previous hardcoded values (no visible
// behavior change until the owner tunes them via the Business Settings CRUD screen) --
// see migration apps/api/src/shared/db/migrations/ai-hr-dashboard-budgets-2026-07-13.sql.
const DEFAULT_BUDGET_OPENAI_MONTHLY_USD = 100;
const DEFAULT_BUDGET_GEMINI_MONTHLY_USD = 50;
const DEFAULT_BUDGET_CLAUDE_MONTHLY_USD = 80;
const DEFAULT_DAILY_LIMIT_OPENAI = 1_000;
const DEFAULT_DAILY_LIMIT_GEMINI = 2_000;
const DEFAULT_DAILY_LIMIT_CLAUDE = 500;
/** submitTask() ad-hoc HR AI call max_tokens cap -- was a bare `800` literal inline. */
const DEFAULT_TASK_MAX_TOKENS = 800;

// P1.7.1: mapping from FE task key → AI task type
const FE_TASK_TYPE_MAP: Partial<Record<string, AiTaskType>> = {
  'resume-parse':         'hr.summarize_cv',
  'quiz-generate':        'hr.generate_interview_questions',
  'job-description':      'hr.onboarding_plan',
  'performance-analysis': 'hr.performance_review',
  'salary-validation':    'hr.salary_benchmark',
  'email-generate':       'cc.generate_document',
  'onboarding-plan':      'hr.onboarding_plan',
  'score-candidate':      'hr.evaluate_candidate',
};

@Injectable()
export class AiHrNewService {
  private readonly logger = new Logger(AiHrNewService.name);

  constructor(
    private readonly repo: DrizzleAiHrNewRepo,
    private readonly aiRouter: AiRouterService,
  ) {}

  async getInterviews(page: number, limit: number) {
    return this.repo.findInterviews(page, limit);
  }

  async createInterview(dto: CreateDto, createdBy: string) {
    return this.repo.createInterview(dto, createdBy);
  }

  async getDashboard(): Promise<Result<AiHrDashboardData>> {
    const statsResult = await this.repo.findDashboardStats();
    if (!isOk(statsResult)) return Err(statsResult.error);

    const tasksResult = await this.repo.findRecentTasks(10);
    if (!isOk(tasksResult)) return Err(tasksResult.error);

    const usageResult = await this.aiRouter.getUsageStats();
    const totalCost = isOk(usageResult) ? (usageResult.data.today?.spent ?? 0) : 0;

    const stats = statsResult.data as Record<string, unknown>;
    const dashboard: AiHrDashboardData = {
      totalAiTasks:        Number(stats['totalAiTasks'] ?? 0),
      completedInterviews: Number(stats['completedInterviews'] ?? 0),
      totalCost,
      recentTasks: (tasksResult.data as { id: string; taskType: string; status: string; createdAt: string }[]),
    };
    return Ok(dashboard);
  }

  /** Q-40: budgets/limits read from business_settings (fallback = pre-existing hardcoded
   *  values, see DEFAULT_* constants above) instead of a static in-code array. */
  private async buildProviderBudgets(): Promise<AiProviderConfig[]> {
    const [
      openaiMonthly, geminiMonthly, claudeMonthly,
      openaiDaily, geminiDaily, claudeDaily,
    ] = await Promise.all([
      getBusinessSettingNumber('ai.hr_dashboard_budget_openai_monthly', DEFAULT_BUDGET_OPENAI_MONTHLY_USD),
      getBusinessSettingNumber('ai.hr_dashboard_budget_gemini_monthly', DEFAULT_BUDGET_GEMINI_MONTHLY_USD),
      getBusinessSettingNumber('ai.hr_dashboard_budget_claude_monthly', DEFAULT_BUDGET_CLAUDE_MONTHLY_USD),
      getBusinessSettingNumber('ai.hr_dashboard_daily_limit_openai', DEFAULT_DAILY_LIMIT_OPENAI),
      getBusinessSettingNumber('ai.hr_dashboard_daily_limit_gemini', DEFAULT_DAILY_LIMIT_GEMINI),
      getBusinessSettingNumber('ai.hr_dashboard_daily_limit_claude', DEFAULT_DAILY_LIMIT_CLAUDE),
    ]);
    return [
      { providerName: 'openai', isActive: true,  monthlyBudget: openaiMonthly, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: openaiDaily },
      { providerName: 'gemini', isActive: true,  monthlyBudget: geminiMonthly, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: geminiDaily },
      { providerName: 'claude', isActive: false, monthlyBudget: claudeMonthly, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: claudeDaily },
    ];
  }

  async getProviders(): Promise<Result<AiProviderConfig[]>> {
    const providerBudgets = await this.buildProviderBudgets();
    const usageResult = await this.aiRouter.getUsageStats();
    if (!isOk(usageResult)) return Ok(providerBudgets);

    const byProvider = usageResult.data.byProvider;
    const configs: AiProviderConfig[] = providerBudgets.map((p) => ({
      ...p,
      dailyRequestsUsed: byProvider[p.providerName as keyof typeof byProvider]?.requestCount ?? 0,
    }));
    return Ok(configs);
  }

  async getUsageBudget(): Promise<Result<AiBudgetItem[]>> {
    const providerBudgets = await this.buildProviderBudgets();
    const usageResult = await this.aiRouter.getUsageStats();
    if (!isOk(usageResult)) return Ok([]);

    const byProvider = usageResult.data.byProvider;
    const items: AiBudgetItem[] = providerBudgets.map((p, idx) => {
      const pData = byProvider[p.providerName as keyof typeof byProvider];
      const spent = pData?.spent ?? 0;
      return {
        id:                `budget-${idx}`,
        provider:          p.providerName,
        monthlyBudget:     p.monthlyBudget,
        monthlySpent:      spent,
        remaining:         p.monthlyBudget - spent,
        isActive:          p.isActive,
        dailyRequestLimit: p.dailyRequestLimit,
        dailyRequestsUsed: pData?.requestCount ?? 0,
      };
    });
    return Ok(items);
  }

  // P1.7.2: real DB query instead of hardcoded stub
  async getTaskById(taskId: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.findInterviewById(taskId);
  }

  // P1.7.1: submit an ad-hoc HR AI task (FE task-type key → AI router)
  async submitTask(
    feTaskKey: string,
    payload: Record<string, unknown>,
    userId: string,
  ): Promise<Result<{ status: 'ok' | 'ai_unavailable'; result: string | null; message: string }>> {
    const taskType: AiTaskType = FE_TASK_TYPE_MAP[feTaskKey] ?? 'hr.evaluate_candidate';
    const prompt = [
      `Task: ${feTaskKey}`,
      `Payload: ${JSON.stringify(payload)}`,
    ].join('\n');

    const maxTokens = await getBusinessSettingNumber('ai.hr_dashboard_task_max_tokens', DEFAULT_TASK_MAX_TOKENS);
    const req: AiRequest = {
      taskType,
      prompt,
      systemPrompt: 'You are an expert HR AI assistant. Provide concise, structured output.',
      maxTokens,
      userId,
      metadata:     { feTaskKey },
    };

    const aiResult = await this.aiRouter.call(req);
    if (!isOk(aiResult)) {
      // Q-40 (no fake success): the previous code returned this INSIDE an Ok() with the
      // message "Task X queued (AI unavailable)" -- HTTP 200, worded as if the task had
      // been queued for later processing. There is no queue/retry worker behind this
      // endpoint: the request simply did not run, and nothing will ever complete it later.
      // Root cause verified live 2026-07-13: no AI provider key configured
      // (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY|GOOGLE_API_KEY) -- an
      // environment/owner-data gap (AiRouterService.call() already returns this exact,
      // honest reason), not a routing bug. The response now says plainly that the task
      // did NOT run, with a status flag the FE can branch on instead of parsing prose.
      this.logger.warn(`HR AI task '${feTaskKey}' bajarilmadi (AI mavjud emas): ${aiResult.error}`);
      return Ok({
        status: 'ai_unavailable',
        result: null,
        message: `AI vazifasi BAJARILMADI: ${aiResult.error}. Bu "navbatga qo'yildi" degani emas — qayta urinish mexanizmi yo'q. Administrator AI provider kalitini (ANTHROPIC_API_KEY/OPENAI_API_KEY/GEMINI_API_KEY) sozlagach qayta yuboring.`,
      });
    }
    return Ok({ status: 'ok', result: aiResult.data.text, message: 'OK' });
  }
}
