/**
 * @module crm-ai.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertAnyRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
  BadRequestException, Body, Controller, Get, Logger, NotFoundException,
  Param, Post, Query, UseGuards,
  UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmAiService } from '../application/crm-ai.service';
import {
  CrmAiContextDtoSchema, CrmAiContextDto,
  CrmAiSuggestActionDtoSchema, CrmAiSuggestActionDto,
} from './dto/crm-ai.dto';

const CRM_AI_ROLES = ['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Ai')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...CRM_AI_ROLES)
export class CrmAiController {
  private readonly logger = new Logger(CrmAiController.name);

  constructor(private readonly svc: CrmAiService) {}

  @ApiOperation({ summary: 'Analyze lead ai' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('leads/:id/ai-analysis')
  @UsePipes(new ZodValidationPipe(CrmAiContextDtoSchema))
  async analyzeLeadAi(@Param('id') id: string, @Body() _body: CrmAiContextDto) {
    const _rAnalyzeLeadAi = await this.svc.analyzeLeadAi(safeInt(id, 0));
    assertOk(_rAnalyzeLeadAi);
    const r = _rAnalyzeLeadAi.data as Record<string, unknown>;
    assertFound(r, 'Lead not found');
    return r;
  }

  @ApiOperation({ summary: 'Score lead v2' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('leads/:id/scoring-v2')
  @UsePipes(new ZodValidationPipe(CrmAiContextDtoSchema))
  async scoreLeadV2(@Param('id') id: string, @Body() _body: CrmAiContextDto) {
    const _rScoreLeadV2 = await this.svc.scoreLeadV2(safeInt(id, 0));
    assertOk(_rScoreLeadV2);
    const r = _rScoreLeadV2.data as Record<string, unknown>;
    assertFound(r, 'Lead not found');
    return r;
  }

  @ApiOperation({ summary: 'Forecast deal' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('deals/:id/ai-forecast')
  @UsePipes(new ZodValidationPipe(CrmAiContextDtoSchema))
  async forecastDeal(@Param('id') id: string, @Body() _body: CrmAiContextDto) {
    const _rForecastDeal = await this.svc.forecastDeal(safeInt(id, 0));
    assertOk(_rForecastDeal);
    const r = _rForecastDeal.data as Record<string, unknown>;
    assertFound(r, 'Deal not found');
    return r;
  }

  @ApiOperation({ summary: 'Get dashboard analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard-analysis')
  async getDashboardAnalysis(@Query('managerId') managerId?: string) {
    return unwrapOrThrow(await this.svc.getDashboardAnalysis(managerId ? safeInt(managerId, 0) : null));
  }

  @ApiOperation({ summary: 'Get next best action' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('nba/:entityType/:entityId')
  @UsePipes(new ZodValidationPipe(CrmAiContextDtoSchema))
  async getNextBestAction(@Param('entityType') entityType: string, @Param('entityId') entityId: string, @Body() _body: CrmAiContextDto) {
    return unwrapOrThrow(await this.svc.getNextBestAction(entityType, safeInt(entityId, 0)));
  }

  @ApiOperation({ summary: 'Suggest action' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('suggest-action')
  @UsePipes(new ZodValidationPipe(CrmAiSuggestActionDtoSchema))
  async suggestAction(@Body() body: CrmAiSuggestActionDto) {
    const lid = body.lead_id ? safeInt(body.lead_id, 0) : null;
    const did = body.deal_id ? safeInt(body.deal_id, 0) : null;
    assertAnyRequired([lid, did], 'lead_id or deal_id required');
    return unwrapOrThrow(await this.svc.suggestAction(lid, did));
  }
}
