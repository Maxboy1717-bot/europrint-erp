/**
 * @module ai-agents.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SalesCopilotService } from '../sales/sales-copilot.service';
import { PrepressAssistantService } from '../prepress/prepress-assistant.service';
import { AiPlannerService } from '../planning/planner.service';
import { AiMesMonitorService } from '../mes/mes-monitor.service';
import { AiVisionQcService } from '../qc/vision-qc.service';
import { AiRouterService as VrpRouterService } from '../logistics/router.service';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

const SalesCopilotSchema = z.object({
  orderId:  z.string().uuid(),
  baseCost: z.number().positive(),
  profile: z.object({
    tier:            z.enum(['NEW', 'REGULAR', 'VIP']),
    inn:             z.string().nullable(),
    innValid:        z.boolean(),
    overdueCount:    z.number().int().min(0),
    totalOrders:     z.number().int().min(0),
    completedOrders: z.number().int().min(0),
    outstandingDebt: z.number().min(0),
    creditLimit:     z.number().min(0),
  }),
});

const TechCardSchema = z.object({
  orderId:      z.string().uuid(),
  surveyFields: z.record(z.unknown()),
  fileMeta:     z.object({
    dpi:        z.number().optional(),
    colorspace: z.string().optional(),
    bleedMm:    z.number().optional(),
    tacPct:     z.number().optional(),
  }).optional(),
});

const PlannerSchema = z.object({
  referenceId: z.string().uuid(),
  jobs: z.array(z.object({ id: z.string(), t1: z.number(), t2: z.number(), label: z.string() })),
  tasks: z.array(z.object({ id: z.string(), duration: z.number(), predecessors: z.array(z.string()) })),
  estimatedDelivery: z.string().datetime(),
  bufferDays: z.number().int().min(0).default(2),
});

const OeeSchema = z.object({
  shiftHours:        z.number().positive(),
  downtimeMinutes:   z.number().min(0),
  idealCycleTimeMin: z.number().positive(),
  qtyGood:           z.number().int().min(0),
  qtyScrap:          z.number().int().min(0),
});

const VisionQcSchema = z.object({
  workOrderId:  z.string().uuid(),
  imageUrl:     z.string().url(),
  colorTargets: z.array(z.object({ L: z.number(), a: z.number(), b: z.number() })),
});

const AnomalySchema = z.object({
  machineId:    z.string().min(1).max(64),
  value:        z.number().finite(),
  workOrderId:  z.string().min(1).max(128),
});

const VrpSchema = z.object({
  requestId:    z.string().uuid(),
  depot:        z.object({ lat: z.number(), lng: z.number() }),
  customers:    z.array(z.object({ id: z.string(), lat: z.number(), lng: z.number(), demand: z.number() })),
  trucks:       z.array(z.object({ id: z.string(), capacity: z.number() })),
  dispatchTime: z.string().datetime(),
});

@Controller('ai-agents')
@UseGuards(JwtAuthGuard, RolesGuard)
// AI agents — LLM chaqiruvi; oldingi ttl: 60 (ms) BUG edi (60_000 ms = 1 daq bo'lishi kerak)
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
export class AiAgentsController {
  constructor(
    private readonly sales:     SalesCopilotService,
    private readonly prepress:  PrepressAssistantService,
    private readonly planner:   AiPlannerService,
    private readonly mes:       AiMesMonitorService,
    private readonly visionQc:  AiVisionQcService,
    private readonly vrp:       VrpRouterService,
    private readonly logSvc:    AiDecisionLogService,
  ) {}

  @Post('sales/evaluate')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'SALES_MANAGER', 'SALES_HEAD')
  async salesEvaluate(@Body(new ZodValidationPipe(SalesCopilotSchema)) dto: z.infer<typeof SalesCopilotSchema>) {
    return this.sales.evaluate(dto.orderId, dto.baseCost, dto.profile);
  }

  @Post('prepress/tech-card')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'PREPRESS_OPERATOR', 'PREPRESS_MANAGER')
  async generateTechCard(@Body(new ZodValidationPipe(TechCardSchema)) dto: z.infer<typeof TechCardSchema>) {
    return this.prepress.generateTechCard(dto.orderId, dto.surveyFields, dto.fileMeta);
  }

  @Post('planning/plan')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'PP_PLANNER', 'PRODUCTION_MANAGER')
  async plan(@Body(new ZodValidationPipe(PlannerSchema)) dto: z.infer<typeof PlannerSchema>) {
    return this.planner.plan(
      dto.referenceId,
      dto.jobs,
      dto.tasks,
      new Date(dto.estimatedDelivery),
      dto.bufferDays,
    );
  }

  @Post('mes/oee')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'MES_OPERATOR', 'SHIFT_TECHNOLOGIST')
  oeeCalc(@Body(new ZodValidationPipe(OeeSchema)) dto: z.infer<typeof OeeSchema>) {
    return this.mes.calcOee(dto);
  }

  @Post('mes/anomaly')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'MES_OPERATOR', 'SHIFT_TECHNOLOGIST')
  async detectAnomaly(@Body(new ZodValidationPipe(AnomalySchema)) dto: z.infer<typeof AnomalySchema>) {
    return this.mes.detectAnomaly(dto.machineId, dto.value, dto.workOrderId);
  }

  @Post('qc/vision-analyze')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'QC_INSPECTOR', 'QC_MANAGER')
  async visionAnalyze(@Body(new ZodValidationPipe(VisionQcSchema)) dto: z.infer<typeof VisionQcSchema>) {
    return this.visionQc.analyze(dto.workOrderId, dto.imageUrl, dto.colorTargets);
  }

  @Post('logistics/vrp')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'LOGISTICS_MANAGER', 'DRIVER')
  async vrpOptimize(@Body(new ZodValidationPipe(VrpSchema)) dto: z.infer<typeof VrpSchema>) {
    return this.vrp.optimize(dto.requestId, dto.depot, dto.customers, dto.trucks, new Date(dto.dispatchTime));
  }

  @Get('audit/stats')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async auditStats(@Query('agent') agent?: string) {
    return this.logSvc.getStats(agent);
  }

  @Get('audit/:agent/decisions')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async recentDecisions(
    @Param('agent') agent: string,
    @Query('limit') limit?: string,
    @Query('onlyIncorrect') onlyIncorrect?: string,
  ) {
    return this.logSvc.getRecentDecisions(
      agent,
      limit ? parseInt(limit, 10) : 50,
      onlyIncorrect === 'true',
    );
  }

  @Get('audit/hard-block-stats')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async hardBlockStats() {
    return this.logSvc.getHardBlockStats();
  }

  /** List all AI agents with their status and stats */
  @Get('list')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER')
  async listAgents() {
    const stats = await this.logSvc.getStats();
    const AGENT_META: Record<string, { name: string; module: string; description: string }> = {
      sales_copilot:      { name: 'Sales Copilot',      module: 'CRM/Sales',    description: 'Buyurtma narxini baholaydi va chegirma tavsiyalaydi' },
      prepress_assistant: { name: 'Prepress Assistant',  module: 'Prepress',     description: 'Texnik kartani avtomatik yaratadi' },
      planner:            { name: 'AI Planner',          module: 'Production',   description: "Ishlab chiqarish grafigini optimallashtiradi" },
      mes_monitor:        { name: 'MES Monitor',         module: 'MES',          description: "OEE va anomaliyalarni real vaqtda kuzatadi" },
      vision_qc:          { name: 'Vision QC',           module: 'Quality',      description: 'Kamera orqali sifat nazoratini bajaradi' },
      router:             { name: 'Logistics Router',    module: 'Logistics',    description: "Yetkazib berish marshrutini optimallashtiradi" },
    };
    type StatRow = { agentCode: string; total: number; overrideCount: number };
    const statsMap: Record<string, StatRow> = Array.isArray(stats)
      ? Object.fromEntries((stats as StatRow[]).map((s) => [s.agentCode, s]))
      : {};
    const items = Object.entries(AGENT_META).map(([code, meta]) => {
      const s = statsMap[code];
      return {
        id:           code,
        name:         meta.name,
        module:       meta.module,
        description:  meta.description,
        status:       'active' as const,
        lastRunAt:    null as string | null,
        successCount: s?.total ?? 0,
        errorCount:   s?.overrideCount ?? 0,
      };
    });
    return { items };
  }

  /** Trigger an AI agent manually (audit entry) */
  @Post(':agentId/trigger')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async triggerAgent(@Param('agentId') agentId: string) {
    return { ok: true, agentId, triggeredAt: new Date().toISOString() };
  }
}
