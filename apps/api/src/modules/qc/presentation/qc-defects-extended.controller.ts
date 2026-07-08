/**
 * @module qc-defects-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired, parseSafe } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards, Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { CommandBus } from '@nestjs/cqrs';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { QcDefectsExtendedService } from '../application/qc-defects-extended.service';
import { ResolveReclamationCommand } from '../application/commands/resolve-reclamation.command';
import { ReportDefectCommand } from '../application/commands/report-defect.command';
import { DefectSeverity } from '../domain/aggregates/defect.aggregate';
import { QcStageSchema, type QcStage } from './qc-new.controller';
import {
  QcCreateBrakSchema, QcCreateBrakDto,
  QcCreateSupplierQualitySchema, QcCreateSupplierQualityDto,
  QcCreateApprovalSchema, QcCreateApprovalDto,
  QcUpdateApprovalSchema, QcUpdateApprovalDto,
  QcUpdateReclamationSchema, QcUpdateReclamationDto,
} from '../dto/qc.dto';

const QC_WRITE_ROLES = ['QC_MANAGER', 'production_manager', 'super_admin', 'director'];
const QC_FLOOR_ROLES = ['qc_inspector', 'operator', 'worker', 'QC_MANAGER', 'production_manager', 'super_admin', 'director'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Qc Defects Extended')
@ApiBearerAuth()
@Controller('qc')
export class QcDefectsExtendedController {
  private readonly logger = new Logger(QcDefectsExtendedController.name);

  constructor(private readonly svc: QcDefectsExtendedService, private readonly commandBus: CommandBus, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List braks' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('braks')
  async listBraks(@Query('sessionId') sessionId?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listBraks(sessionId ? safeInt(sessionId, 0) : null, safeInt(limit, 50), safeInt(offset, 0)));
  }

  // Alias for /defects/extended — FE DefectManagementPage queries this path. Registered
  // before /defects/:id so the literal "extended" segment isn't captured as an id param.
  @ApiOperation({ summary: 'List defects extended' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('defects/extended')
  async listDefectsExtended(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const rows = unwrapOrThrow(await this.svc.listBraks(null, safeInt(limit, 50), safeInt(offset, 0))) as unknown[];
    return { items: Array.isArray(rows) ? rows : [] };
  }

  @ApiOperation({ summary: 'Get brak stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('braks/stats')
  async getBrakStats(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrThrow(await this.svc.getBrakStats(from, to));
  }

  @ApiOperation({ summary: 'Get brak cost impact' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('braks/cost-impact/:papkaOrderId')
  async getBrakCostImpact(@Param('papkaOrderId') papkaOrderId: string) {
    return unwrapOrThrow(await this.svc.getBrakCostImpact(safeInt(papkaOrderId, 0)));
  }

  @ApiOperation({ summary: 'Create brak' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('braks')
  @UsePipes(new ZodValidationPipe(QcCreateBrakSchema))
  @Roles(...QC_FLOOR_ROLES)
  async createBrak(@Body() body: QcCreateBrakDto) {
    assertRequired((body as Record<string, unknown>).quantity, await this.i18n.t('errors.quantityRequired'));
    // QC-birlashtirish (2026-07-02, APPROVED egasi): brak yozuvi endi qc_braks-ga to'g'ridan
    // INSERT o'rniga ReportDefectCommand CQRS oqimi orqali qc_defects jadvaliga yoziladi
    // (6 ta yangi ustun: papka_order_id/stage/cost_impact/is_reworkable/reworked/brak_date).
    // material_id/session_id/root_cause_id qc_defects'da ustun sifatida yo'q — description
    // ichida saqlanadi, shuning uchun ma'lumot yo'qolmaydi.
    const contextNotes: string[] = [];
    if (body.material_id != null) contextNotes.push(`material_id=${safeInt(body.material_id, 0)}`);
    if (body.session_id != null) contextNotes.push(`session_id=${safeInt(body.session_id, 0)}`);
    if (body.root_cause_id != null) contextNotes.push(`root_cause_id=${safeInt(body.root_cause_id, 0)}`);
    const baseDescription = body.description != null ? String(body.description) : (body.reason != null ? String(body.reason) : 'Brak');
    const description = contextNotes.length > 0 ? `${baseDescription} [${contextNotes.join(', ')}]` : baseDescription;
    // stage/brak_date are optional in QcCreateBrakSchema but the brak UNION readers (qc-new /
    // qc-defects-extended repos, qc.bot) only recognize a qc_defects row as a "brak" when at
    // least one of papka_order_id/stage/brak_date is non-null. The pre-CQRS repo.createBrak
    // always defaulted these two (stage ?? 'production', brak_date ?? today) -- replicate that
    // intent here so a minimal-payload POST /qc/braks still lands as a visible brak, not a
    // hidden row.
    //
    // VISION-3340 #42: 'production' is NOT a member of the qc_stage enum enforced by
    // QcNewController.createCheckpoint (incoming/in_process/final/dispatch) — the two write
    // paths into qc_defects disagreed on valid "stage" values. Validate the incoming value
    // against that SAME exported schema (QcStageSchema, imported — not redefined here) and
    // default to 'in_process', the shop-floor/production-line stage of that enum and the same
    // default CheckpointDto already uses, which best matches the original 'production' intent.
    const effectiveStage: QcStage = parseSafe(
      QcStageSchema.default('in_process'),
      body.stage,
      `stage noto'g'ri qiymat: "${String(body.stage)}" — ruxsat etilgan: ${QcStageSchema.options.join(', ')}`,
    );
    const effectiveBrakDate = body.brak_date != null ? String(body.brak_date) : new Date().toISOString().slice(0, 10);

    const cmd = new ReportDefectCommand(
      null,
      null,
      null,
      body.reason != null ? String(body.reason) : 'other',
      description,
      DefectSeverity.MINOR,
      safeInt(body.quantity, 0),
      'pcs',
      body.reported_by != null ? String(safeInt(body.reported_by, 0)) : 'system-user',
      {
        papkaOrderId: body.papka_order_id != null ? safeInt(body.papka_order_id, 0) : null,
        stage: effectiveStage,
        costImpact: null,
        isReworkable: null,
        reworked: null,
        brakDate: effectiveBrakDate,
      },
    );
    const _rCreateBrak = await this.commandBus.execute(cmd);
    assertOk(_rCreateBrak);
    return _rCreateBrak.data;
  }

  @ApiOperation({ summary: 'List supplier quality' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('supplier-quality')
  async listSupplierQuality(@Query('vendorId') vendorId?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listSupplierQuality(vendorId ? safeInt(vendorId, 0) : null, safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Create supplier quality' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('supplier-quality')
  @UsePipes(new ZodValidationPipe(QcCreateSupplierQualitySchema))
  @Roles(...QC_WRITE_ROLES)
  async createSupplierQuality(@Body() body: QcCreateSupplierQualityDto) {
    assertRequired(body.supplier_name, await this.i18n.t('validation.supplierNameRequired'));
    const _rCreateSupplierQuality = await this.svc.createSupplierQuality(
      body.vendor_id != null ? safeInt(body.vendor_id, 0) : null,
      String(body.supplier_name),
      body.receipt_id != null ? safeInt(body.receipt_id, 0) : null,
      body.material_id != null ? safeInt(body.material_id, 0) : null,
      body.batch_number != null ? String(body.batch_number) : null,
      safeInt(body.sample_size ?? 0, 0),
      safeInt(body.defects_found ?? 0, 0),
      body.quality_score != null ? Number(body.quality_score) : null,
      body.notes != null ? String(body.notes) : null,
      body.status != null ? String(body.status) : null);
    assertOk(_rCreateSupplierQuality);
    return _rCreateSupplierQuality.data;
  }

  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard/stats')
  async getDashboardStats(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrThrow(await this.svc.getDashboardStats(from, to));
  }

  @ApiOperation({ summary: 'Get dashboard flow' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard/flow')
  async getDashboardFlow() {
    return unwrapOrThrow(await this.svc.getDashboardFlow());
  }

  @ApiOperation({ summary: 'List approvals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('approvals')
  async listApprovals(@Query('status') status?: string, @Query('type') type?: string) {
    return unwrapOrThrow(await this.svc.listApprovals(type, status));
  }

  @ApiOperation({ summary: 'Create approval' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Update approval' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('approvals/:id')
  @UsePipes(new ZodValidationPipe(QcUpdateApprovalSchema))
  @Roles(...QC_WRITE_ROLES)
  async updateApproval(@Param('id') id: string, @Body() body: QcUpdateApprovalDto) {
    const _rR = await this.svc.updateApproval(safeInt(id, 0), String(body.status), body.notes != null ? String(body.notes) : null);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.approvalRequestNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Update reclamation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('reclamations/:id')
  @UsePipes(new ZodValidationPipe(QcUpdateReclamationSchema))
  @Roles(...QC_WRITE_ROLES)
  async updateReclamation(@Param('id') id: string, @Body() body: QcUpdateReclamationDto) {
    const cmd = new ResolveReclamationCommand(
      safeInt(id, 0),
      body.status != null ? String(body.status) : null,
      body.resolution != null ? String(body.resolution) : null,
    );
    const _rR = await this.commandBus.execute(cmd);
    assertOk(_rR);
    return _rR.data;
  }
}
