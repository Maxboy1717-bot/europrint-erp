/**
 * @module qc-parameters.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { QcParametersService } from '../application/qc-parameters.service';
import { z } from 'zod';

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
@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
