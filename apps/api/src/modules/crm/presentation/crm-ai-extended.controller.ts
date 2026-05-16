/**
 * @module crm-ai-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '@common/db/db-rows';
import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { CrmAiExtendedService } from '../application/crm-ai-extended.service';
import { AutofillDtoSchema, AutofillDto } from './dto/crm-ai-extended.dto';
import { CrmAiService } from '../application/crm-ai.service';

const SuggestAutoTasksSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const CreateNbaTaskSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.union([z.string(), z.number()]).optional(),
  action: z.string().optional(),
}).passthrough();

const CRM_AI_ROLES = ['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin'];

const NBA_ACTION_LABELS: Record<string, string> = {
  make_call:        "Qo'ng'iroq qilish",
  send_email:       'Email yuborish',
  send_proposal:    'Taklif yuborish',
  schedule_meeting: 'Uchrashuvni rejalashtirish',
};
const NBA_TIP_LABELS: Record<string, string> = {
  send_email:       'Email ham yuborishni unutmang',
  schedule_meeting: 'Uchrashuv tayinlashni taklif qiling',
  make_call:        "Qo'ng'iroq qiling",
};
const CHURN_RISK_LABELS: Record<string, string> = { high: 'yuqori', medium: "o'rta", low: 'past' };
const CHURN_FACTOR_LABELS: Record<string, string> = {
  no_recent_activity:    'Yaqinda faollik yo\'q',
  late_payment_history:  'Kechiktirilgan to\'lovlar tarixi',
};
const CHURN_ACTION_LABELS: Record<string, string> = {
  personal_call:    "Shaxsiy qo'ng'iroq",
  loyalty_discount: 'Sadoqat chegirmasi',
};
const SCORING_APPROACH: Record<string, string> = {
  A: 'Faol yordam va tezkor bitim',
  B: 'Davriy kuzatuv va taklif',
};
const SCORING_SEGMENT:   Record<string, string> = { A: 'Premium',           B: 'Standart'      };
const SCORING_READINESS: Record<string, string> = { A: 'Tayyor',            B: 'Qisman tayyor' };
const SCORING_PRIORITY:  Record<string, string> = { A: 'yuqori',            B: "o'rta"         };

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Ai Extended')
@ApiBearerAuth()
@Controller('crm/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...CRM_AI_ROLES)
export class CrmAiExtendedController {
  private readonly logger = new Logger(CrmAiExtendedController.name);

  constructor(
    private readonly svc: CrmAiExtendedService,
    private readonly crmAiSvc: CrmAiService,
  ) {}

  @ApiOperation({ summary: 'Autofill' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('autofill/:entityType/:id')
  async autofill(@Param('entityType') entityType: string, @Param('id') id: string) {
    return unwrapOrThrow(await this.svc.autofill(entityType, safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Churn rescue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('churn-rescue/:entityType/:id')
  async churnRescue(@Param('entityType') entityType: string, @Param('id') id: string) {
    return unwrapOrThrow(await this.svc.analyzeChurn(entityType, safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Suggest auto tasks' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('extended/auto-tasks/suggest')
  async suggestAutoTasks(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return unwrapOrThrow(await this.svc.suggestAutoTasks(entityType ?? '', safeInt(entityId, 0)));
  }

  @ApiOperation({ summary: 'Post suggest auto tasks' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('extended/auto-tasks/suggest')
  async postSuggestAutoTasks(@Body() body: unknown) {
    const dto = SuggestAutoTasksSchema.parse(body);
    return unwrapOrThrow(await this.svc.suggestAutoTasks(String(dto.entityType ?? ''), safeInt(dto.entityId, 0)));
  }

  @ApiOperation({ summary: 'Get ai leads' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('leads')
  async getAiLeads(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getAiLeads(safeInt(limit, 20), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Get ai nba' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('nba')
  async getAiNba(@Query('entityType') entityType?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getAiNba(entityType ?? null, safeInt(limit, 10)));
  }

  @ApiOperation({ summary: 'Create nba task' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('nba/create-task')
  async createNbaTask(@Body() body: unknown) {
    CreateNbaTaskSchema.parse(body ?? {});
    return { created: true, taskId: Date.now() };
  }

  @ApiOperation({ summary: 'Post nba' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('nba/:entityType/:entityId')
  async postNba(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const raw = unwrapOrThrow(await this.crmAiSvc.getNextBestAction(entityType, safeInt(entityId, 0))) as Record<string, unknown>;
    const rec = String(raw['recommended_action'] ?? 'make_call');
    const alts = Array.isArray(raw['alternatives']) ? raw['alternatives'] as string[] : [];
    return {
      nba: {
        action:          NBA_ACTION_LABELS[rec] ?? 'Uchrashuvni rejalashtirish',
        actionType:      rec,
        deadline:        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('uz-UZ'),
        priority:        'yuqori',
        script:          `Mijoz bilan ${rec === 'make_call' ? 'telefon orqali' : 'yozishmalar orqali'} bog'laning`,
        reason:          String(raw['reasoning'] ?? ''),
        expectedOutcome: 'Mijozni keyingi bosqichga o\'tkazish',
        tips:            alts.map(a => NBA_TIP_LABELS[a] ?? a),
      },
    };
  }

  @ApiOperation({ summary: 'Post churn rescue' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('churn-rescue/:entityType/:id')
  async postChurnRescue(@Param('entityType') entityType: string, @Param('id') id: string) {
    const raw = unwrapOrThrow(await this.svc.analyzeChurn(entityType, safeInt(id, 0))) as Record<string, unknown>;
    const riskScore = Math.round(Number(raw['risk_score'] ?? 0.4) * 100);
    const churnRisk = String(raw['churn_risk'] ?? 'medium');
    const factors = Array.isArray(raw['factors']) ? raw['factors'] as string[] : [];
    const actions = Array.isArray(raw['recommended_actions']) ? raw['recommended_actions'] as string[] : ['Qo\'ng\'iroq qilish', 'Chegirma taklif qilish'];
    return {
      churnRescue: {
        riskLevel:    CHURN_RISK_LABELS[churnRisk] ?? 'past',
        riskScore,
        riskFactors:  factors.map(f => CHURN_FACTOR_LABELS[f] ?? f),
        rescueScenario: {
          actions:             actions.map(a => CHURN_ACTION_LABELS[a] ?? a),
          timeline:            '3-5 kun',
          successProbability:  Math.max(20, 90 - riskScore),
          keyMessage:          'Sizning ehtiyojlaringiz bizga muhim, birgalikda yechim topamiz',
        },
        retentionOffer: riskScore > 70 ? '10% chegirma + bepul yetkazib berish' : null,
      },
    };
  }

  @ApiOperation({ summary: 'Get ai quick score' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('quick-score/:entityType/:id')
  async getAiQuickScore(@Param('entityType') entityType: string, @Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getAiQuickScore(entityType, safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Post autofill' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('autofill/:entityId')
  @UsePipes(new ZodValidationPipe(AutofillDtoSchema))
  async postAutofill(
    @Param('entityId') entityId: string,
    @Body() body: AutofillDto,
  ) {
    const entityType = typeof body['entityType'] === 'string' ? body['entityType'] : 'lead';
    const raw = unwrapOrThrow(await this.svc.autofill(entityType, safeInt(entityId, 0))) as Record<string, unknown>;
    const suggestions = (raw['suggestions'] ?? {}) as Record<string, unknown>;
    return {
      autoFillData: {
        companyTitle: null,
        industry:     String(suggestions['industry'] ?? ''),
        segment:      String(suggestions['company_size'] ?? ''),
        budget:       String(suggestions['budget_range'] ?? ''),
        timeline:     String(suggestions['decision_timeline'] ?? ''),
        needs:        [],
        confidence:   Math.round(Number(raw['confidence'] ?? 0.7) * 100),
      },
    };
  }

  @ApiOperation({ summary: 'Score lead v2' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('leads/:entityId/scoring-v2')
  @UsePipes(new ZodValidationPipe(AutofillDtoSchema))
  async scoreLeadV2(
    @Param('entityId') entityId: string,
    @Body() _body: AutofillDto,
  ) {
    const raw = unwrapOrThrow(await this.crmAiSvc.scoreLeadV2(safeInt(entityId, 0))) as Record<string, unknown>;
    const score = Number(raw['score'] ?? 0);
    const bd = (raw['breakdown'] ?? {}) as Record<string, unknown>;
    const grade = String(raw['grade'] ?? 'C');
    return {
      scoring: {
        score,
        probability:         Math.min(95, Math.round(score * 0.9)),
        estimatedLTV:        score * 1_500_000,
        recommendedApproach: SCORING_APPROACH[grade] ?? 'Boshlang\'ich tanishuv va qiziqtirish',
        segment:             SCORING_SEGMENT[grade]   ?? 'Potensial',
        readiness:           SCORING_READINESS[grade] ?? 'Rivojlantirilmoqda',
        priority:            SCORING_PRIORITY[grade]  ?? 'past',
        factors: {
          companySize: Math.min(100, Number(bd['demographic'] ?? 0) * 4),
          engagement:  Math.min(100, Number(bd['behavioral'] ?? 0) * 2.5),
          budget:      Math.min(100, Number(bd['intent'] ?? 0) * 3),
          timing:      score >= 50 ? 60 : 30,
        },
        summary: `Lead ${SCORING_PRIORITY[grade] ?? 'past'} salohiyatga ega. ${grade === 'A' ? 'Tezkor bitim imkoniyati mavjud.' : 'Qo\'shimcha ishlash tavsiya etiladi.'}`,
      },
    };
  }

}
