/**
 * @module seven-functions.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from 'shared/guards/roles.guard';
import { Roles } from 'shared/decorators/roles.decorator';
import { CurrentUser } from 'shared/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { SevenFunctionsService } from '../application/seven-functions.service';
import {
  SfCreateFunctionSchema, SfCreateFunctionDto,
  SfUpdateFunctionSchema, SfUpdateFunctionDto,
  SfCreateKpiSchema, SfCreateKpiDto,
  SfUpdateKpiSchema, SfUpdateKpiDto,
  SfAnalyzeFunctionSchema, SfAnalyzeFunctionDto,
} from '../../director/presentation/dto/director.dto';

const MANAGER_ROLES = ['director', 'super_admin', 'manager'];

@ApiThrottle()
@ApiTags('Seven Functions')
@Controller('seven-functions')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SevenFunctionsController {
  private readonly logger = new Logger(SevenFunctionsController.name);

  constructor(private readonly svc: SevenFunctionsService) {}

  @ApiOperation({ summary: 'List functions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('functions')
  async listFunctions() {
    return unwrapOrThrow(await this.svc.listFunctions());
  }

  @ApiOperation({ summary: 'Get function' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('functions/:id')
  async getFunction(@Param('id') id: string) {
    const _r = await this.svc.getFunction(parseInt(id, 10));
    assertOk(_r);
    const data = _r.data as Record<string, unknown>[];
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @ApiOperation({ summary: 'Create function' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('functions')
  @Roles(...MANAGER_ROLES)
  @UsePipes(new ZodValidationPipe(SfCreateFunctionSchema))
  async createFunction(
    @Body() body: SfCreateFunctionDto,
    @CurrentUser() user: { id: number },
  ) {
    assertRequired((body as Record<string, unknown>).name, 'name required');
    const _r = await this.svc.createFunction(
      body.name,
      body.description ?? null,
      body.owner_id ? Number(body.owner_id) : user.id,
      body.order_index ? Number(body.order_index) : 1,
      user.id,
    );
    assertOk(_r);
    return _r.data;
  }

  @ApiOperation({ summary: 'Update function' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('functions/:id')
  @Roles(...MANAGER_ROLES)
  @UsePipes(new ZodValidationPipe(SfUpdateFunctionSchema))
  async updateFunction(
    @Param('id') id: string,
    @Body() body: SfUpdateFunctionDto,
  ) {
    const _r = await this.svc.updateFunction(
      parseInt(id, 10),
      body.name ?? null,
      body.description ?? null,
      body.owner_id ? Number(body.owner_id) : null,
      body.order_index ? Number(body.order_index) : null,
    );
    assertOk(_r);
    return _r.data;
  }

  @ApiOperation({ summary: 'Delete function' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('functions/:id')
  @Roles(...MANAGER_ROLES)
  async deleteFunction(@Param('id') id: string) {
    await this.svc.deleteFunction(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @ApiOperation({ summary: 'Get function kpis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('kpis/:functionId')
  async getFunctionKpis(@Param('functionId') functionId: string) {
    return unwrapOrThrow(await this.svc.getFunctionKpis(parseInt(functionId, 10)));
  }

  @ApiOperation({ summary: 'Create kpi' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('kpis')
  @Roles(...MANAGER_ROLES)
  @UsePipes(new ZodValidationPipe(SfCreateKpiSchema))
  async createKpi(@Body() body: SfCreateKpiDto) {
    assertRequired((body as Record<string, unknown>).function_id, 'function_id required');
    assertRequired((body as Record<string, unknown>).name, 'name required');
    const _r = await this.svc.createKpi(
      Number(body.function_id),
      body.name,
      body.target_value ? Number(body.target_value) : null,
      body.unit ?? 'unit',
      body.responsible_id ? Number(body.responsible_id) : null,
      body.frequency ?? 'monthly',
    );
    assertOk(_r);
    return _r.data;
  }

  @ApiOperation({ summary: 'Update kpi' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('kpis/:id')
  @Roles(...MANAGER_ROLES)
  @UsePipes(new ZodValidationPipe(SfUpdateKpiSchema))
  async updateKpi(
    @Param('id') id: string,
    @Body() body: SfUpdateKpiDto,
  ) {
    const _r = await this.svc.updateKpi(
      parseInt(id, 10),
      body.name ?? null,
      body.target_value != null ? Number(body.target_value) : null,
      body.actual_value != null ? Number(body.actual_value) : null,
      body.unit ?? null,
      body.responsible_id ? Number(body.responsible_id) : null,
    );
    assertOk(_r);
    return _r.data;
  }

  @ApiOperation({ summary: 'Delete kpi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('kpis/:id')
  @Roles(...MANAGER_ROLES)
  async deleteKpi(@Param('id') id: string) {
    await this.svc.deleteKpi(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @ApiOperation({ summary: 'Analyze function' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('analyze')
  @UsePipes(new ZodValidationPipe(SfAnalyzeFunctionSchema))
  async analyzeFunction(@Body() body: SfAnalyzeFunctionDto) {
    const _r = await this.svc.analyzeFunction(Number(body.function_id));
    assertOk(_r);
    const { funcData, kpiData } = _r.data as { funcData: Record<string, unknown>; kpiData: Record<string, unknown>[] };
    const completedKpis = (Array.isArray(kpiData) ? kpiData : []).filter((k) => k.actual_value !== null);
    const avgProgress = completedKpis.length > 0
      ? (Array.isArray(completedKpis) ? completedKpis : []).reduce((sum, k) => sum + (Number(k.actual_value) / Math.max(Number(k.target_value), 1)) * 100, 0) / completedKpis.length
      : 0;
    return {
      function: funcData,
      kpis: kpiData,
      analysis: { avg_progress: Math.round(avgProgress), total_kpis: kpiData.length },
    };
  }

  /**
   * SevenFunctionsDashboard page calls GET /api/seven-functions/ai-analysis
   * for a cross-function rollup. Until the dedicated rollup service exists,
   * return empty defaults so the dashboard renders the "no data yet" state.
   */
  @ApiOperation({ summary: 'Get ai analysis rollup' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ai-analysis')
  async getAiAnalysisRollup(@Query('period') _period?: string) {
    return {
      functions:    [],
      strengths:    [],
      weaknesses:   [],
      recommendations: [],
      overall_score: 0,
      generated_at: new Date().toISOString(),
    };
  }
}
