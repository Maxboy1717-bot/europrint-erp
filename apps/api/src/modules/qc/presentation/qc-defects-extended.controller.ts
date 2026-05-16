/**
 * @module qc-defects-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards, Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { QcDefectsExtendedService } from '../application/qc-defects-extended.service';
import {
  QcCreateBrakSchema, QcCreateBrakDto,
  QcCreateSupplierQualitySchema, QcCreateSupplierQualityDto,
  QcCreateApprovalSchema, QcCreateApprovalDto,
  QcUpdateApprovalSchema, QcUpdateApprovalDto,
  QcUpdateReclamationSchema, QcUpdateReclamationDto,
} from '../dto/qc.dto';

const QC_WRITE_ROLES = ['QC_MANAGER', 'production_manager', 'super_admin', 'director'];
const QC_FLOOR_ROLES = ['qc_inspector', 'operator', 'worker', 'QC_MANAGER', 'production_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('qc')
export class QcDefectsExtendedController {
  private readonly logger = new Logger(QcDefectsExtendedController.name);

  constructor(private readonly svc: QcDefectsExtendedService) {}

  @Get('braks')
  async listBraks(@Query('sessionId') sessionId?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listBraks(sessionId ? safeInt(sessionId, 0) : null, safeInt(limit, 50), safeInt(offset, 0)));
  }

  // Alias for /defects/extended — FE DefectManagementPage queries this path. Registered
  // before /defects/:id so the literal "extended" segment isn't captured as an id param.
  @Get('defects/extended')
  async listDefectsExtended(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const rows = unwrapOrThrow(await this.svc.listBraks(null, safeInt(limit, 50), safeInt(offset, 0))) as unknown[];
    return { items: Array.isArray(rows) ? rows : [] };
  }

  @Get('braks/stats')
  async getBrakStats(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrThrow(await this.svc.getBrakStats(from, to));
  }

  @Get('braks/cost-impact/:papkaOrderId')
  async getBrakCostImpact(@Param('papkaOrderId') papkaOrderId: string) {
    return unwrapOrThrow(await this.svc.getBrakCostImpact(safeInt(papkaOrderId, 0)));
  }

  @Post('braks')
  @UsePipes(new ZodValidationPipe(QcCreateBrakSchema))
  @Roles(...QC_FLOOR_ROLES)
  async createBrak(@Body() body: QcCreateBrakDto) {
    assertRequired((body as Record<string, unknown>).quantity, 'quantity required');
    const _rCreateBrak = await this.svc.createBrak(
      body.session_id != null ? safeInt(body.session_id, 0) : null,
      body.material_id != null ? safeInt(body.material_id, 0) : null,
      safeInt(body.quantity, 0),
      body.reason != null ? String(body.reason) : null,
      body.root_cause_id != null ? safeInt(body.root_cause_id, 0) : null,
      body.reported_by != null ? safeInt(body.reported_by, 0) : null,
      body.papka_order_id != null ? safeInt(body.papka_order_id, 0) : null);
    assertOk(_rCreateBrak);
    return _rCreateBrak.data;
  }

  @Get('supplier-quality')
  async listSupplierQuality(@Query('vendorId') vendorId?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listSupplierQuality(vendorId ? safeInt(vendorId, 0) : null, safeInt(limit, 50)));
  }

  @Post('supplier-quality')
  @UsePipes(new ZodValidationPipe(QcCreateSupplierQualitySchema))
  @Roles(...QC_WRITE_ROLES)
  async createSupplierQuality(@Body() body: QcCreateSupplierQualityDto) {
    assertRequired(body.vendor_id, 'vendor_id required');
    const _rCreateSupplierQuality = await this.svc.createSupplierQuality(
      safeInt(body.vendor_id ?? 0, 0),
      body.receipt_id != null ? safeInt(body.receipt_id, 0) : null,
      body.material_id != null ? safeInt(body.material_id, 0) : null,
      body.batch_number != null ? String(body.batch_number) : null,
      safeInt(body.sample_size ?? 0, 0),
      safeInt(body.defects_found ?? 0, 0),
      body.notes != null ? String(body.notes) : null,
      body.status != null ? String(body.status) : null);
    assertOk(_rCreateSupplierQuality);
    return _rCreateSupplierQuality.data;
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrThrow(await this.svc.getDashboardStats(from, to));
  }

  @Get('dashboard/flow')
  async getDashboardFlow() {
    return unwrapOrThrow(await this.svc.getDashboardFlow());
  }

  @Get('approvals')
  async listApprovals(@Query('status') status?: string, @Query('type') type?: string) {
    return unwrapOrThrow(await this.svc.listApprovals(type, status));
  }

  @Post('approvals')
  @UsePipes(new ZodValidationPipe(QcCreateApprovalSchema))
  @Roles(...QC_WRITE_ROLES)
  async createApproval(@Body() body: QcCreateApprovalDto) {
    return unwrapOrThrow(await this.svc.createApproval(
      String(body.type),
      safeInt(body.reference_id, 0),
      body.approver_id != null ? safeInt(body.approver_id, 0) : null,
      body.notes != null ? String(body.notes) : null,
    ));
  }

  @Patch('approvals/:id')
  @UsePipes(new ZodValidationPipe(QcUpdateApprovalSchema))
  @Roles(...QC_WRITE_ROLES)
  async updateApproval(@Param('id') id: string, @Body() body: QcUpdateApprovalDto) {
    const _rR = await this.svc.updateApproval(safeInt(id, 0), String(body.status), body.notes != null ? String(body.notes) : null);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Approval not found');
    return r[0];
  }

  @Patch('reclamations/:id')
  @UsePipes(new ZodValidationPipe(QcUpdateReclamationSchema))
  @Roles(...QC_WRITE_ROLES)
  async updateReclamation(@Param('id') id: string, @Body() body: QcUpdateReclamationDto) {
    const _rR = await this.svc.updateReclamation(
      safeInt(id, 0),
      body.status != null ? String(body.status) : null,
      body.resolution != null ? String(body.resolution) : null,
      body.root_cause_id != null ? safeInt(body.root_cause_id, 0) : null,
    );
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Reclamation not found');
    return r[0];
  }
}
