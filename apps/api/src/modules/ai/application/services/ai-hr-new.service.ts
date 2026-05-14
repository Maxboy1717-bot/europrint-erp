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

import { MAX_EXPORT_LIMIT, AI_DAILY_LIMIT_HIGH, AI_SHORT_MAX_TOKENS } from '@common/constants/app.constants';
type CreateDto = z.infer<typeof CreateAiInterviewDtoSchema>;

const PROVIDER_BUDGETS: AiProviderConfig[] = [
  { providerName: 'openai', isActive: true,  monthlyBudget: 100, monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: MAX_EXPORT_LIMIT },
  { providerName: 'gemini', isActive: true,  monthlyBudget: 50,  monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: AI_DAILY_LIMIT_HIGH },
  { providerName: 'claude', isActive: false, monthlyBudget: 80,  monthlySpent: 0, dailyRequestsUsed: 0, dailyRequestLimit: AI_SHORT_MAX_TOKENS  },
];

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

  async getTaskById(taskId: string): Promise<Result<Record<string, unknown>>> {
    return Ok({
      id:         taskId,
      taskType:   'hr.evaluate_candidate',
      status:     'completed',
      result:     null,
      createdAt:  _time.now().toISOString(),
    });
  }
}
