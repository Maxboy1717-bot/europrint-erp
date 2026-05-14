/**
 * @module ai-finance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {Controller, Post, Get, Body, UseGuards, Query, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FinanceAiService } from '../services/finance-ai.service';
import { FinanceAiAnalysisService } from '../services/finance-ai-analysis.service';
import {
  AiFinanceCashflowDtoSchema, AiFinanceCashflowDto,
  AiFinanceBudgetVarianceDtoSchema, AiFinanceBudgetVarianceDto,
  AiFinanceClassifyInvoiceDtoSchema, AiFinanceClassifyInvoiceDto,
  AiFinanceFraudRiskDtoSchema, AiFinanceFraudRiskDto,
} from './dto/ai-finance.dto';
import { unwrapOrInternal } from '@common/http-result';
import { isErr } from '@common/result';

// AiFinanceInsight shape expected by DailyKPIDashboard
interface AiFinanceInsight {
  id: string;
  insightType: string;
  segment: string;
  insightDate: string;
  confidence?: number;
  priority: string;
  title: string;
  description: string;
  impact?: string;
  recommendation?: string;
  actionRequired: boolean;
  actionTaken: boolean;
}

const SEVERITY_TO_PRIORITY: Record<string, string> = {
  HIGH:   'high',
  MEDIUM: 'medium',
  LOW:    'low',
};

@ApiTags('AI — Finance')
@ApiBearerAuth()
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('ai/finance')
export class AiFinanceController {
  private readonly logger = new Logger(AiFinanceController.name);
  constructor(
    private readonly financeAi: FinanceAiService,
    private readonly financeAnalysis: FinanceAiAnalysisService,
  ) {}

  @Get('anomalies')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'cfo', 'director')
  @ApiOperation({ summary: 'Moliyaviy anomaliyalarni aniqlash' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Tahlil davri (kun), default: 30' })
  async detectAnomalies(@Query('days') days: string, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.financeAi.detectAnomalies(days ? +days : 30, user.id));
  }

  @Get('insights')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'cfo', 'director', 'manager')
  @ApiOperation({ summary: 'AI moliya insightlari (DailyKPI dashboard uchun)' })
  async getInsights(@CurrentUser() user: AuthenticatedUser): Promise<{ insights: AiFinanceInsight[]; generatedAt: string }> {
    const today = _time.now().toISOString().slice(0, 10);
    const result = await this.financeAi.detectAnomalies(30, user.id);

    if (isErr(result)) {
      return { insights: [], generatedAt: _time.now().toISOString() };
    }

    const anomalyData = result.data as {
      hasAnomalies?: boolean;
      anomalies?: Array<{ description: string; severity: string; amount?: number }>;
      overallRiskScore?: number;
      recommendation?: string;
    };

    const insights: AiFinanceInsight[] = [];

    // Convert anomalies to insight cards
    const anomalies = anomalyData.anomalies ?? [];
    for (const a of anomalies.slice(0, 5)) {
      insights.push({
        id: `anomaly-${insights.length}`,
        insightType: 'anomaly',
        segment: 'moliya',
        insightDate: today,
        confidence: anomalyData.overallRiskScore ?? 75,
        priority: SEVERITY_TO_PRIORITY[a.severity] ?? 'medium',
        title: `Anomaliya aniqlandi`,
        description: a.description,
        impact: a.amount != null ? `Miqdor: ${a.amount.toLocaleString()} UZS` : undefined,
        recommendation: anomalyData.recommendation,
        actionRequired: a.severity === 'HIGH',
        actionTaken: false,
      });
    }

    // Add overall risk insight if there are no anomalies but score is notable
    if (anomalies.length === 0 && (anomalyData.overallRiskScore ?? 0) > 0) {
      insights.push({
        id: 'risk-overview',
        insightType: 'forecast',
        segment: 'moliya',
        insightDate: today,
        confidence: 100 - (anomalyData.overallRiskScore ?? 0),
        priority: 'low',
        title: 'Moliyaviy holat barqaror',
        description: anomalyData.recommendation ?? 'So\'nggi 30 kunda muhim anomaliyalar aniqlanmadi.',
        actionRequired: false,
        actionTaken: false,
      });
    }

    return { insights, generatedAt: _time.now().toISOString() };
  }

  @Post('cashflow-forecast')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'cfo', 'director')
  @ApiOperation({ summary: 'Keyingi oy pul oqimi bashorati' })
  @UsePipes(new ZodValidationPipe(AiFinanceCashflowDtoSchema))
  async cashflowForecast(
    @Body() body: AiFinanceCashflowDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.financeAi.forecastCashflow(body.historicalData, user.id));
  }

  @Post('budget-variance')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'cfo', 'director', 'manager')
  @ApiOperation({ summary: 'Byudjet og\'ishini tushuntirish' })
  @UsePipes(new ZodValidationPipe(AiFinanceBudgetVarianceDtoSchema))
  async budgetVariance(
    @Body() body: AiFinanceBudgetVarianceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.financeAnalysis.explainBudgetVariance(
      body.category, body.budgeted, body.actual, body.context, user.id,
    ));
  }

  @Post('classify-invoice')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'cfo')
  @ApiOperation({ summary: 'Fakturani AI tasnifi (kategoriya, soliq kodi)' })
  @UsePipes(new ZodValidationPipe(AiFinanceClassifyInvoiceDtoSchema))
  async classifyInvoice(
    @Body() body: AiFinanceClassifyInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.financeAnalysis.classifyInvoice(body.description, body.amount, body.vendor, user.id));
  }

  @Post('fraud-risk')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'cfo', 'director')
  @ApiOperation({ summary: 'Tranzaksiya fraud xavfini baholash' })
  @UsePipes(new ZodValidationPipe(AiFinanceFraudRiskDtoSchema))
  async fraudRisk(
    @Body() body: AiFinanceFraudRiskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.financeAnalysis.assessFraudRisk(body.transactionData, user.id));
  }
}
