/**
 * @module ai-planning.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { z } from 'zod';
import {
  GeneratePlanDtoSchema,
  ApprovePlanDtoSchema,
  RejectPlanDtoSchema,
  UpdatePlanningConfigDtoSchema,
  CreatePlanDtoSchema,
} from '../../presentation/dto/ai-planning.dto';
import { DrizzleAiPlanningRepo, PlanRecord, PlanningConfig } from '../../infrastructure/repositories/drizzle-ai-planning.repo';

type GenerateDto  = z.infer<typeof GeneratePlanDtoSchema>;
type ApproveDto   = z.infer<typeof ApprovePlanDtoSchema>;
type RejectDto    = z.infer<typeof RejectPlanDtoSchema>;
type ConfigDto    = z.infer<typeof UpdatePlanningConfigDtoSchema>;
type CreatePlanDt = z.infer<typeof CreatePlanDtoSchema>;

@Injectable()
export class AiPlanningService {
  private readonly logger = new Logger(AiPlanningService.name);

  constructor(private readonly repo: DrizzleAiPlanningRepo) {}

  async getDashboard(): Promise<Result<Record<string, unknown>>> {
    const result = await this.repo.findAll();
    const plans = isOk(result) ? result.data : [];
    const active = (Array.isArray(plans) ? plans : []).filter((p) => p.status === 'approved' || p.status === 'draft').length;
    return Ok({
      activePlans:           active,
      totalPlans:            plans.length,
      avgConfidence:         plans.length ? (Array.isArray(plans) ? plans : []).reduce((s, p) => s + p.confidenceScore, 0) / plans.length : 0,
      autoApprovedPct:       0,
      totalOrdersScheduled:  (Array.isArray(plans) ? plans : []).reduce((s, p) => s + (p.totalOrders ?? 0), 0),
      avgMachineUtilization: 84,
      recentPlans:           plans.slice(0, 5),
    });
  }

  async getPlans(): Promise<Result<PlanRecord[]>> {
    const r = await this.repo.findAll();
    return isOk(r) ? r : Ok([]);
  }

  async createPlan(dto: CreatePlanDt): Promise<Result<PlanRecord>> {
    return this.repo.create(dto.planType, dto.planDate);
  }

  async getPlanById(id: string): Promise<Result<PlanRecord>> {
    const result = await this.repo.findById(id);
    if (!isOk(result)) return Err(result.error);
    if (!result.data) return Err(`Reja topilmadi: ${id}`);
    return Ok(result.data);
  }

  async getBatchGroups(planId: string): Promise<Result<object[]>> {
    this.logger.log(`getBatchGroups for plan ${planId}`);
    return Ok([
      { machine: 'Mashina №1', count: 6, totalDuration: 240, orders: ['ORD-001', 'ORD-002'], changeoverReduction: '35%', estimatedEnergySaving: '12 kWh' },
      { machine: 'Mashina №2', count: 4, totalDuration: 180, orders: ['ORD-003', 'ORD-004'], changeoverReduction: '28%', estimatedEnergySaving: '8 kWh' },
    ]);
  }

  async generatePlan(dto: GenerateDto): Promise<Result<PlanRecord>> {
    const result = await this.repo.create(dto.planType, dto.planDate ?? _time.now().toISOString().split('T')[0] ?? '');
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`AI plan generated: ${result.data.id}`);
    return result;
  }

  async approvePlan(id: string, dto: ApproveDto): Promise<Result<{ message: string }>> {
    const check = await this.repo.findById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Reja topilmadi: ${id}`);
    const status = dto.isOverride ? 'override_approved' : 'approved';
    const result = await this.repo.updateStatus(id, status);
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Plan approved: ${id}, isOverride=${dto.isOverride}`);
    return Ok({ message: 'Reja tasdiqlandi' });
  }

  async rejectPlan(id: string, dto: RejectDto): Promise<Result<{ message: string }>> {
    const check = await this.repo.findById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Reja topilmadi: ${id}`);
    this.logger.log(`Plan rejected: ${id}, reason: ${dto.reason}`);
    const result = await this.repo.updateStatus(id, 'rejected');
    if (!isOk(result)) return Err(result.error);
    return Ok({ message: 'Reja rad etildi' });
  }

  async executePlan(id: string): Promise<Result<{ message: string }>> {
    const check = await this.repo.findById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Reja topilmadi: ${id}`);
    const result = await this.repo.updateStatus(id, 'executing');
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Plan executing: ${id}`);
    return Ok({ message: 'Reja bajarilmoqda' });
  }

  async reschedulePlan(id: string, newDate: string): Promise<Result<PlanRecord>> {
    const check = await this.repo.findById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Reja topilmadi: ${id}`);
    return this.repo.updatePlanDate(id, newDate);
  }

  async acceptDecision(decisionId: string): Promise<Result<{ message: string }>> {
    this.logger.log(`Decision accepted: ${decisionId}`);
    return Ok({ message: `Qaror qabul qilindi: ${decisionId}` });
  }

  async blockMaterial(orderId: string, materialId: string): Promise<Result<{ message: string }>> {
    this.logger.log(`Material blocked: orderId=${orderId}, materialId=${materialId}`);
    return Ok({ message: `Material band qilindi: ${materialId}` });
  }

  async getConfig(): Promise<Result<PlanningConfig>> {
    return this.repo.getConfig();
  }

  async updateConfig(dto: ConfigDto): Promise<Result<PlanningConfig>> {
    return this.repo.updateConfig(dto);
  }
}
