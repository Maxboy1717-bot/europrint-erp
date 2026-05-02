import { Controller, Get, Post, Query, Param, Body, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, unwrapOrNotFound } from '@common/http-result';
import { QcNewService } from '../application/qc-new.service';
import { SpcService } from '../domain/services/spc.service';
import { z } from 'zod';

const CheckpointDto = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stage: z.enum(['incoming', 'in_process', 'final', 'dispatch']).default('in_process'),
  standard_id: z.number().optional(),
});

const LabTestDto = z.object({
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

@ApiTags('QC')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcNewController {
  constructor(
    private readonly svc: QcNewService,
    private readonly spcSvc: SpcService,
  ) {}

  @Get('dashboard')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'QC comprehensive dashboard' })
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('checkpoints')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List QC checkpoints' })
  async getCheckpoints(@Query('stage') stage?: string) {
    return unwrapOrInternal(await this.svc.getCheckpoints(stage));
  }

  @Post('checkpoints')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create QC checkpoint' })
  async createCheckpoint(@Body() body: unknown) {
    const dto = CheckpointDto.parse(body);
    return unwrapOrInternal(await this.svc.createCheckpoint(dto));
  }

  @Get('ai-trend')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'AI-powered QC trend analysis' })
  async getAiTrend() {
    return unwrapOrInternal(await this.svc.getAiTrend());
  }

  @Get('certificates')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List quality certificates' })
  async getCertificates(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getCertificates(status));
  }

  @Get('lab-tests')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List lab tests' })
  async getLabTests(@Query('orderId') orderId?: string) {
    return unwrapOrInternal(await this.svc.getLabTests(orderId));
  }

  @Post('lab-tests')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create lab test result' })
  async createLabTest(@Body() body: unknown) {
    const dto = LabTestDto.parse(body);
    return unwrapOrInternal(await this.svc.createLabTest(dto));
  }

  @Get('spc/control-chart')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'SPC control chart data' })
  async getSpcControlChart(@Query('parameterId') parameterId?: string) {
    const pid = parameterId ? parseInt(parameterId, 10) : undefined;
    return unwrapOrInternal(await this.svc.getSpcControlChart(pid));
  }

  @Get('control-charts/:processId')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'SPC control chart with UCL/LCL computation' })
  async getControlChart(
    @Param('processId') processId: string,
    @Query('n') n?: string,
  ) {
    const lastN = n ? Math.min(parseInt(n, 10) || 30, 100) : 30;
    const result = await this.spcSvc.getControlChart(parseInt(processId, 10), lastN);
    return unwrapOrNotFound(result);
  }

  @Get('supplier-quality/ratings')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Supplier quality ratings aggregated' })
  async getSupplierQualityRatings() {
    return unwrapOrInternal(await this.svc.getSupplierQualityRatings());
  }
}
