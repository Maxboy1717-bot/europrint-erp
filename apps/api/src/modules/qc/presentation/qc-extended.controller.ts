import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { QcExtendedService } from '../application/qc-extended.service';
import {
  QcCreateStandardSchema, QcCreateStandardDto,
  QcUpdateStandardSchema, QcUpdateStandardDto,
  QcCreateFinalInspectionSchema, QcCreateFinalInspectionDto,
  QcCompleteFinalInspectionSchema, QcCompleteFinalInspectionDto,
  QcCreateInProcessInspectionSchema, QcCreateInProcessInspectionDto,
  QcCreateRootCauseSchema, QcCreateRootCauseDto,
  QcUpdateRootCauseSchema, QcUpdateRootCauseDto,
} from '../dto/qc.dto';

const QC_WRITE_ROLES = ['QC_MANAGER', 'production_manager', 'super_admin', 'director'];
const QC_FLOOR_ROLES = ['qc_inspector', 'operator', 'worker', 'QC_MANAGER', 'production_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('qc')
export class QcExtendedController {
  private readonly logger = new Logger(QcExtendedController.name);

  constructor(private readonly svc: QcExtendedService) {}

  @Get('standards')
  async listStandards(@Query('category') category?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listStandards(category, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('standards/:id')
  async getStandard(@Param('id') id: string) {
    const _rR = await this.svc.getStandard(safeInt(id, 0));
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Standard not found');
    return r[0];
  }

  @Post('standards')
  @UsePipes(new ZodValidationPipe(QcCreateStandardSchema))
  @Roles(...QC_WRITE_ROLES)
  async createStandard(@Body() body: QcCreateStandardDto) {
    assertRequired((body as Record<string, unknown>).name, 'name required');
    return unwrapOrThrow(await this.svc.createStandard(body.name, body.category ?? null, body.description ?? null, body.parameters ?? null, body.is_active ?? null));
  }

  @Patch('standards/:id')
  @UsePipes(new ZodValidationPipe(QcUpdateStandardSchema))
  @Roles(...QC_WRITE_ROLES)
  async updateStandard(@Param('id') id: string, @Body() body: QcUpdateStandardDto) {
    const _rR = await this.svc.updateStandard(safeInt(id, 0), body.name ?? null, body.category ?? null, body.description ?? null, body.is_active ?? null);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Standard not found');
    return r[0];
  }

  @Get('final-inspections')
  async listFinalInspections(@Query('status') status?: string, @Query('orderId') orderId?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listFinalInspections(status, orderId ? safeInt(orderId, 0) : null, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('final-orders')
  async getFinalOrders(@Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getFinalOrders(safeInt(limit, 50)));
  }

  @Post('final-inspections')
  @UsePipes(new ZodValidationPipe(QcCreateFinalInspectionSchema))
  @Roles(...QC_WRITE_ROLES)
  async createFinalInspection(@Body() body: QcCreateFinalInspectionDto) {
    return unwrapOrThrow(await this.svc.createFinalInspection(body.order_id, body.inspector_id ?? null, 'pending', body.notes ?? null, false));
  }

  @Post('final-inspections/:id/complete')
  @UsePipes(new ZodValidationPipe(QcCompleteFinalInspectionSchema))
  @Roles(...QC_WRITE_ROLES)
  async completeFinalInspection(@Param('id') id: string, @Body() body: QcCompleteFinalInspectionDto) {
    const _rR = await this.svc.completeFinalInspection(safeInt(id, 0), body.result ?? null, body.notes ?? null, body.defect_count ?? 0, body.passed !== false);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Final inspection not found');
    return r[0];
  }

  @Get('in-process')
  async listInProcess(@Query('sessionId') sessionId?: string, @Query('status') status?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listInProcess(sessionId ? safeInt(sessionId, 0) : null, status, safeInt(limit, 50)));
  }

  @Post('in-process')
  @UsePipes(new ZodValidationPipe(QcCreateInProcessInspectionSchema))
  @Roles(...QC_FLOOR_ROLES)
  async createInProcessInspection(@Body() body: QcCreateInProcessInspectionDto) {
    return unwrapOrThrow(await this.svc.createInProcessInspection(body.session_id, body.inspector_id ?? null, body.check_point ?? null, body.sample_size, body.defects_found, body.notes ?? null));
  }

  @Get('root-causes')
  async listRootCauses() {
    return unwrapOrThrow(await this.svc.listRootCauses());
  }

  @Post('root-causes')
  @UsePipes(new ZodValidationPipe(QcCreateRootCauseSchema))
  @Roles(...QC_WRITE_ROLES)
  async createRootCause(@Body() body: QcCreateRootCauseDto) {
    return unwrapOrThrow(await this.svc.createRootCause(body.name, body.description, body.category));
  }

  @Patch('root-causes/:id')
  @UsePipes(new ZodValidationPipe(QcUpdateRootCauseSchema))
  @Roles(...QC_WRITE_ROLES)
  async updateRootCause(@Param('id') id: string, @Body() body: QcUpdateRootCauseDto) {
    const _rR = await this.svc.updateRootCause(safeInt(id, 0), body.name ?? null, body.description ?? null, body.category ?? null);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Root cause not found');
    return r[0];
  }
}
