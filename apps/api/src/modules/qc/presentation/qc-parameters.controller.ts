/**
 * @module qc-parameters.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { QcParametersService } from '../application/qc-parameters.service';
import { z } from 'zod';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

const ParameterDto = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  target_value: z.number().optional(),
  description: z.string().optional(),
});

const TestDto = z.object({
  order_id: z.number().optional(),
  parameter_name: z.string().min(1),
  value: z.number().optional(),
  unit: z.string().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  tested_by: z.string().optional(),
  notes: z.string().optional(),
});

const QC_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];
const QC_ADMIN = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, 'qc_manager'];

@ApiTags('QC')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcParametersController {
  constructor(private readonly svc: QcParametersService) {}

  @Get('parameters/grouped')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List QC parameters grouped by category' })
  async getParametersGrouped() {
    return unwrapOrInternal(await this.svc.getParametersGrouped());
  }

  @Get('parameters/paper')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Paper-specific QC parameters (subset of grouped output)' })
  async getPaperParameters() {
    const result = await this.svc.getParametersGrouped();
    if (!result.ok) return unwrapOrInternal(result);
    // Filter to the "paper" / "physical" category that PaperParametersPage renders.
    const grouped = (result.data ?? {}) as Record<string, unknown>;
    const paper = (grouped as Record<string, unknown[]>)['paper']
              ?? (grouped as Record<string, unknown[]>)['physical']
              ?? [];
    return Array.isArray(paper) ? paper : [];
  }

  @Post('parameters')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...QC_ADMIN)
  @ApiOperation({ summary: 'Create QC parameter' })
  async createParameter(@Body() body: unknown) {
    const dto = ParameterDto.parse(body);
    return unwrapOrInternal(await this.svc.createParameter(dto));
  }

  @Patch('parameters/:id')
  @Roles(...QC_ADMIN)
  @ApiOperation({ summary: 'Update QC parameter' })
  async updateParameter(@Param('id') id: string, @Body() body: unknown) {
    const dto = ParameterDto.partial().parse(body);
    return unwrapOrInternal(await this.svc.updateParameter(parseInt(id, 10), dto));
  }

  @Delete('parameters/:id')
  @Roles(...QC_ADMIN)
  @ApiOperation({ summary: 'Deactivate QC parameter' })
  async deleteParameter(@Param('id') id: string) {
    unwrapOrInternal(await this.svc.deleteParameter(parseInt(id, 10)));
    return { id, deleted: true };
  }

  @Post('seed-parameters')
  @Roles(...QC_ADMIN)
  @ApiOperation({ summary: 'Seed default QC parameters' })
  async seedParameters() {
    return unwrapOrInternal(await this.svc.seedParameters());
  }

  @Get('tests')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List QC material tests' })
  async getTests(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrInternal(await this.svc.getTests(parseInt(limit ?? '50', 10) || 50, parseInt(offset ?? '0', 10) || 0));
  }

  @Get('tests/recent')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List recent QC tests' })
  async getRecentTests(@Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getRecentTests(parseInt(limit ?? '10', 10) || 10));
  }

  @Get('tests/:id')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Get a single QC test by id (used by QCApproval page detail view)' })
  async getTestById(@Param('id') id: string) {
    try {
      const r = await rawSql(sql`
        SELECT qmt.id::text AS id, qmt.test_results AS results,
               qmt.overall_status AS status, qmt.passed_count AS "passedCount",
               qmt.failed_count AS "failedCount", qmt.test_date AS "testedAt",
               qmt.notes, qmt.batch_number AS "batchNumber",
               qmt.material_id AS "materialId"
        FROM qc_material_tests qmt WHERE qmt.id = ${parseInt(id, 10)}
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0];
      return row ?? { id, results: [], passed: null, testedAt: null, found: false };
    } catch { return { id, results: [], passed: null, testedAt: null, found: false }; }
  }

  @Post('tests')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create QC material test' })
  async createTest(@Body() body: unknown) {
    const dto = TestDto.parse(body);
    return unwrapOrInternal(await this.svc.createTest(dto));
  }

  @Post('tests/:id/ai-analyze')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'AI analysis of QC test result' })
  async aiAnalyzeTest(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.aiAnalyzeTest(parseInt(id, 10)));
  }

  @Delete('standards/:id')
  @Roles(...QC_ADMIN)
  @ApiOperation({ summary: 'Delete QC standard' })
  async deleteStandard(@Param('id') id: string) {
    unwrapOrInternal(await this.svc.deleteStandard(parseInt(id, 10)));
    return { id, deleted: true };
  }
}
