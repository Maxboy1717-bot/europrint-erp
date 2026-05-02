import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Result } from '@common/result';
import { aiPlanningPlans } from '@europrint/schemas';

export interface PlanRecord {
  id:                    string;
  planNumber:            string;
  planDate:              string;
  planType:              string;
  status:                string;
  confidenceScore:       number;
  autoApproved:          boolean;
  autoApprovalThreshold: number | null;
  totalOrders:           number | null;
  totalMachineHours:     number | null;
  estimatedCompletion:   string | null;
  planData:              unknown[];
  optimizationMetrics:   Record<string, number>;
  aiRecommendations:     { type: string; message: string }[];
  createdAt:             string;
}

export interface PlanningConfig {
  autoApprovalThreshold:    number;
  maxShiftHours:            number;
  batchGroupingEnabled:     boolean;
  energyOptimizationWeight: number;
  changeoverMinutes:        number;
}

const DEFAULT_CONFIG: PlanningConfig = {
  autoApprovalThreshold:    90,
  maxShiftHours:            8,
  batchGroupingEnabled:     true,
  energyOptimizationWeight: 0.3,
  changeoverMinutes:        15,
};

@Injectable()
export class DrizzleAiPlanningRepo {
  private config: PlanningConfig = { ...DEFAULT_CONFIG };

  constructor(private readonly drizzle: DrizzleService) {}

  private toRecord(r: typeof aiPlanningPlans.$inferSelect): PlanRecord {
    return {
      id:                    r.id,
      planNumber:            r.planNumber,
      planDate:              r.planDate,
      planType:              r.planType,
      status:                r.status,
      confidenceScore:       r.confidenceScore,
      autoApproved:          r.autoApproved,
      autoApprovalThreshold: r.autoApprovalThreshold,
      totalOrders:           r.totalOrders,
      totalMachineHours:     r.totalMachineHours,
      estimatedCompletion:   r.estimatedCompletion?.toISOString() ?? null,
      planData:              (r.planData as Record<string, unknown>[]) ?? [],
      optimizationMetrics:   (r.optimizationMetrics as Record<string, number>) ?? {},
      aiRecommendations:     (r.aiRecommendations as { type: string; message: string }[]) ?? [],
      createdAt:             r.createdAt?.toISOString() ?? _time.now().toISOString(),
    };
  }

  async findAll(): Promise<Result<PlanRecord[]>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiPlanningPlans)
        .orderBy(desc(aiPlanningPlans.createdAt))
        .limit(50);
      return (rows ?? []).map((r) => this.toRecord(r));
    });
  }

  async findById(id: string): Promise<Result<PlanRecord | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiPlanningPlans)
        .where(eq(aiPlanningPlans.id, id))
        .limit(1);
      return row ? this.toRecord(row) : null;
    });
  }

  async create(planType: string, planDate: string): Promise<Result<PlanRecord>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiPlanningPlans)
        .values({
          planNumber:       `PLAN-${Date.now()}`,
          planDate,
          planType,
          status:           'draft',
          confidenceScore:  87,
          autoApproved:     false,
          planData:         [],
          optimizationMetrics: { machineUtilization: 84, energyEfficiency: 76, changeoverReduction: 32 },
          aiRecommendations:   [{ type: 'info', message: 'AI reja yaratildi' }],
        })
        .returning();
      if (!row) throw new Error('AI reja yaratishda xato: natija qaytmadi');
      return this.toRecord(row);
    });
  }

  async updateStatus(id: string, status: string): Promise<Result<PlanRecord>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .update(aiPlanningPlans)
        .set({ status })
        .where(eq(aiPlanningPlans.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Reja topilmadi: ${id}`);
      return this.toRecord(row);
    });
  }

  async updatePlanDate(id: string, planDate: string): Promise<Result<PlanRecord>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .update(aiPlanningPlans)
        .set({ planDate, status: 'rescheduled' })
        .where(eq(aiPlanningPlans.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Reja topilmadi: ${id}`);
      return this.toRecord(row);
    });
  }

  async getConfig(): Promise<Result<PlanningConfig>> {
    return safeCall(async () => ({ ...this.config }));
  }

  async updateConfig(partial: Partial<PlanningConfig>): Promise<Result<PlanningConfig>> {
    return safeCall(async () => {
      this.config = { ...this.config, ...partial };
      return { ...this.config };
    });
  }
}

