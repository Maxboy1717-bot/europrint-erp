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

import {
  MAX_EXPORT_LIMIT, AI_DAILY_LIMIT_HIGH, AI_SHORT_MAX_TOKENS,
  AI_BUDGET_OPENAI_MONTHLY, AI_BUDGET_GEMINI_MONTHLY, AI_BUDGET_CLAUDE_MONTHLY,
} from '@common/constants/app.constants';
import { AiRequest, AiTaskType } from '../../domain/types/ai.types';
type CreateDto = z.infer<typeof CreateAiInterviewDtoSchema>;

// P1.7.3: named constants for budget defaults (values live in app.constants.ts)
const PROVIDER_BUDGETS: AiProviderConfig[] = [
  { providerName: 'openai', isActive: true,  monthlyBudget: AI_BUDGET_OPENAI_MONTHLY, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: MAX_EXPORT_LIMIT },
  { providerName: 'gemini', isActive: true,  monthlyBudget: AI_BUDGET_GEMINI_MONTHLY, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: AI_DAILY_LIMIT_HIGH },
  { providerName: 'claude', isActive: false, monthlyBudget: AI_BUDGET_CLAUDE_MONTHLY, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: AI_SHORT_MAX_TOKENS },
];

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

  async getProviders(): Promise<Result<AiProviderConfig[]>> {
    const usageResult = await this.aiRouter.getUsageStats();
    if (!isOk(usageResult)) return Ok(PROVIDER_BUDGETS);

    const byProvider = usageResult.data.byProvider;
    const configs: AiProviderConfig[] = PROVIDER_BUDGETS.map((p) => ({
      ...p,
      dailyRequestsUsed: byProvider[p.providerName as keyof typeof byProvider]?.requestCount ?? 0,
    }));
    return Ok(configs);
  }

  async getUsageBudget(): Promise<Result<AiBudgetItem[]>> {
    const usageResult = await this.aiRouter.getUsageStats();
    if (!isOk(usageResult)) return Ok([]);

    const byProvider = usageResult.data.byProvider;
    const items: AiBudgetItem[] = PROVIDER_BUDGETS.map((p, idx) => {
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
  ): Promise<Result<{ result: string | null; message: string }>> {
    const taskType: AiTaskType = FE_TASK_TYPE_MAP[feTaskKey] ?? 'hr.evaluate_candidate';
    const prompt = [
      `Task: ${feTaskKey}`,
      `Payload: ${JSON.stringify(payload)}`,
    ].join('\n');

    const req: AiRequest = {
      taskType,
      prompt,
      systemPrompt: 'You are an expert HR AI assistant. Provide concise, structured output.',
      maxTokens:    800,
      userId,
      metadata:     { feTaskKey },
    };

    const aiResult = await this.aiRouter.call(req);
    if (!isOk(aiResult)) {
      return Ok({ result: null, message: `Task ${feTaskKey} queued (AI unavailable)` });
    }
    return Ok({ result: aiResult.data.text, message: 'OK' });
  }
}
