/**
 * @module ai-director.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {Controller, Post, Get, Body, UseGuards, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DirectorAiService } from '../services/director-ai.service';
import { DirectorAiStrategyService } from '../services/director-ai-strategy.service';
import {
  AiDirectorKpiExplainDtoSchema, AiDirectorKpiExplainDto,
  AiDirectorRiskAssessDtoSchema, AiDirectorRiskAssessDto,
  AiDirectorStrategicDtoSchema, AiDirectorStrategicDto,
} from './dto/ai-director.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('AI — Director')
@ApiBearerAuth()
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('ai/director')
export class AiDirectorController {
  private readonly logger = new Logger(AiDirectorController.name);
  constructor(
    private readonly directorAi: DirectorAiService,
    private readonly directorStrategy: DirectorAiStrategyService,
  ) {}

  @Post('kpi-explain')
  @UseGuards(RolesGuard)
  @Roles('admin', 'director', 'manager', 'cfo')
  @ApiOperation({ summary: 'KPI ko\'rsatkichini AI tushuntirishi' })
  @UsePipes(new ZodValidationPipe(AiDirectorKpiExplainDtoSchema))
  async explainKpi(
    @Body() body: AiDirectorKpiExplainDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.directorAi.explainKpi(
      body.kpiName, body.currentValue, body.targetValue,
      body.historicalValues, body.context, user.id,
    ));
  }

  @Post('risk-assess')
  @UseGuards(RolesGuard)
  @Roles('admin', 'director', 'cfo')
  @ApiOperation({ summary: 'Kompaniya xavflarini AI baholash' })
  @UsePipes(new ZodValidationPipe(AiDirectorRiskAssessDtoSchema))
  async riskAssess(
    @Body() body: AiDirectorRiskAssessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.directorAi.assessRisks(body.companyData, user.id));
  }

  @Post('strategic-recommendations')
  @UseGuards(RolesGuard)
  @Roles('admin', 'director')
  @ApiOperation({ summary: 'Strategik tavsiyalar (qisqa/o\'rta/uzun muddatli)' })
  @UsePipes(new ZodValidationPipe(AiDirectorStrategicDtoSchema))
  async strategicRecommendations(
    @Body() body: AiDirectorStrategicDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.directorStrategy.generateStrategicRecommendations(body.businessContext as Parameters<typeof this.directorStrategy.generateStrategicRecommendations>[0], user.id));
  }

  @Get('executive-summary')
  @UseGuards(RolesGuard)
  @Roles('admin', 'director')
  @ApiOperation({ summary: 'Bugungi ijroiya xulosasi (AI)' })
  async executiveSummary(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.directorStrategy.generateExecutiveSummary(user.id));
  }
}
