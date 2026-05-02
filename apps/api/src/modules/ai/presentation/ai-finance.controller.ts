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

@ApiTags('AI — Finance')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
