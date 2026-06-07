/**
 * @module qc-defects.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrNotFoundDefined } from '@common/http-result';
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors , BadRequestException, NotFoundException} from '@nestjs/common';
import { notImplemented } from '@common/exceptions/not-implemented';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ReportDefectCommand } from '../application/commands/report-defect.command';
import { ResolveDefectCommand } from '../application/commands/resolve-defect.command';
import { GetDefectsQuery } from '../application/queries/get-defects.query';
import { GetDefectStatsQuery } from '../application/queries/get-defect-stats.query';
import { GetDefectByIdQuery } from '../application/queries/get-defect-by-id.query';
import { DefectStatus } from '../domain/aggregates/defect.aggregate';
import { ReportDefectDtoSchema, ResolveDefectDtoSchema, GetDefectsDtoSchema } from './dto/defect.dto';
import { DefectSeverity } from '../domain/aggregates/defect.aggregate';
import { z } from 'zod';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const QcApprovalSchema = z.object({
  notes: z.string().max(2000).optional(),
  approvedBy: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const QcRejectionSchema = z.object({
  reason: z.string().max(2000).optional(),
  rejectedBy: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const InspectorSubmitSchema = z.object({
  results: z.array(z.record(z.unknown())).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

enum Role {
  QC_MANAGER = 'qc_manager',
  PRODUCTION_MANAGER = 'production_manager',
  SUPER_ADMIN = 'super_admin',
}

@ApiThrottle()
@ApiTags('Qc Defects')
@Controller('qc')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcDefectsController {
  private readonly logger = new Logger(QcDefectsController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  /** Persist a QC status transition on the order's qc_inspections row (opened by the MES->QC trigger).
   *  Was missing: the approve/reject/submit routes echoed {approved:true} without writing the DB. */
  private async _setQcStatus(orderId: string, status: string): Promise<boolean> {
    const oid = parseInt(orderId, 10);
    if (!Number.isFinite(oid)) return false;
    const r = await db.execute(sql`UPDATE qc_inspections SET status=${status}, updated_at=NOW() WHERE order_id=${oid}`);
    return ((r as unknown as { rowCount?: number }).rowCount ?? 0) > 0;
  }

  @ApiOperation({ summary: 'Get defects' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('defects')
  async getDefects(@Query() queryParams: Record<string, unknown>) {

      const parsed = GetDefectsDtoSchema.parse(queryParams);
      const query = new GetDefectsQuery(parsed.severity as DefectSeverity, parsed.status as DefectStatus, parsed.productionOrderId, parsed.from ? new Date(parsed.from) : undefined, parsed.to ? new Date(parsed.to) : undefined, parsed.page, parsed.limit);
      const result = await this.queryBus.execute(query);
      assertOk(result);
      return result.data;
    
  }

  @ApiOperation({ summary: 'Get defect stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('defects/stats')
  @Roles(Role.QC_MANAGER, Role.SUPER_ADMIN)
  async getDefectStats() {

      const result = await this.queryBus.execute(new GetDefectStatsQuery());
      assertOk(result);
      return (result).data;
    
  }

  @ApiOperation({ summary: 'Get defect by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('defects/:id')
  async getDefectById(@Param('id') id: string) {

      const result = await this.queryBus.execute(new GetDefectByIdQuery(id));
      return unwrapOrNotFoundDefined(result, 'Defect not found');
    
  }

  @ApiOperation({ summary: 'Report defect' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('defects')
  @Roles(Role.QC_MANAGER, Role.PRODUCTION_MANAGER)
  async reportDefect(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

      const parsed = ReportDefectDtoSchema.parse(body);
      const cmd = new ReportDefectCommand(parsed.inspectionId ?? null, parsed.productionOrderId ?? null, parsed.workCenterId ?? null, parsed.defectCode ?? '', parsed.description ?? '', parsed.severity as DefectSeverity, parsed.quantity ?? 0, parsed.unit ?? '', String(user.id ?? user.userId ?? 'system-user'));
      const result = await this.commandBus.execute(cmd);
      assertOk(result);
      this.logger.log('Defect reported');
      return (result).data;
    
  }

  @ApiOperation({ summary: 'Resolve defect' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('defects/:id/resolve')
  @Roles(Role.QC_MANAGER, Role.SUPER_ADMIN)
  async resolveDefect(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

      const parsed = ResolveDefectDtoSchema.parse(body);
      const cmd = new ResolveDefectCommand(id, String(user?.id ?? user?.userId ?? 'system-user'), parsed.resolution);
      const result = await this.commandBus.execute(cmd);
      assertOk(result);
      this.logger.log('Defect resolved');
      return { statusCode: HttpStatus.OK, data: { id: (result).data } };
    
  }

  @ApiOperation({ summary: 'Get braks cost impact aggregated by stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('braks/cost-impact')
  async getBraksCostImpact() {
    const r = await db.execute(sql`
      SELECT stage, COUNT(*)::int AS count, SUM(quantity)::int AS total_quantity,
        SUM(COALESCE(cost_impact, 0))::numeric AS total_cost
      FROM qc_braks
      WHERE deleted_at IS NULL OR deleted_at IS NULL
      GROUP BY stage ORDER BY total_cost DESC
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get pending QC defects' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pending/qc')
  async getPendingQc() {
    const r = await db.execute(sql`
      SELECT * FROM qc_defects
      WHERE (status IS NULL OR status NOT IN ('resolved','closed'))
      ORDER BY created_at DESC LIMIT 100
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Approve finance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('approve/finance/:orderId')
  async approveFinance(@Param('orderId') orderId: string, @Body() body: unknown) {
    const dto = QcApprovalSchema.parse(body ?? {});
    const approved = await this._setQcStatus(orderId, 'finance_approved');
    const oid = parseInt(orderId, 10);
    if (Number.isFinite(oid)) {
      const approver = dto.approvedBy != null ? Number(dto.approvedBy) || null : null;
      await db.execute(sql`
        INSERT INTO qc_approvals (order_id, approval_stage, approved_by, status, notes)
        VALUES (${oid}, 'finance', ${approver}, 'approved', ${dto.notes ?? null})
      `);
    }
    return { orderId, approved };
  }

  @ApiOperation({ summary: 'Post approve finance' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('approve/finance/:orderId')
  async postApproveFinance(@Param('orderId') orderId: string, @Body() body: unknown) {
    const dto = QcApprovalSchema.parse(body ?? {});
    const approved = await this._setQcStatus(orderId, 'finance_approved');
    const oid = parseInt(orderId, 10);
    if (Number.isFinite(oid)) {
      const approver = dto.approvedBy != null ? Number(dto.approvedBy) || null : null;
      await db.execute(sql`
        INSERT INTO qc_approvals (order_id, approval_stage, approved_by, status, notes)
        VALUES (${oid}, 'finance', ${approver}, 'approved', ${dto.notes ?? null})
      `);
    }
    return { orderId, approved };
  }

  @ApiOperation({ summary: 'Approve qc' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('approve/qc/:orderId')
  async approveQc(@Param('orderId') orderId: string, @Body() body: unknown) {
    const dto = QcApprovalSchema.parse(body ?? {});
    const approved = await this._setQcStatus(orderId, 'qc_approved');
    const oid = parseInt(orderId, 10);
    if (Number.isFinite(oid)) {
      const approver = dto.approvedBy != null ? Number(dto.approvedBy) || null : null;
      await db.execute(sql`
        INSERT INTO qc_approvals (order_id, approval_stage, approved_by, status, notes)
        VALUES (${oid}, 'qc', ${approver}, 'approved', ${dto.notes ?? null})
      `);
    }
    return { orderId, approved };
  }

  @ApiOperation({ summary: 'Post approve qc' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('approve/qc/:orderId')
  async postApproveQc(@Param('orderId') orderId: string, @Body() body: unknown) {
    const dto = QcApprovalSchema.parse(body ?? {});
    const approved = await this._setQcStatus(orderId, 'qc_approved');
    const oid = parseInt(orderId, 10);
    if (Number.isFinite(oid)) {
      const approver = dto.approvedBy != null ? Number(dto.approvedBy) || null : null;
      await db.execute(sql`
        INSERT INTO qc_approvals (order_id, approval_stage, approved_by, status, notes)
        VALUES (${oid}, 'qc', ${approver}, 'approved', ${dto.notes ?? null})
      `);
    }
    return { orderId, approved };
  }

  @ApiOperation({ summary: 'Reject order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('reject/:orderId')
  async rejectOrder(@Param('orderId') orderId: string, @Body() body: unknown) {
    QcRejectionSchema.parse(body ?? {});
    const rejected = await this._setQcStatus(orderId, 'rejected');
    return { orderId, rejected };
  }

  @ApiOperation({ summary: 'Post reject order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('reject/:orderId')
  async postRejectOrder(@Param('orderId') orderId: string, @Body() body: unknown) {
    QcRejectionSchema.parse(body ?? {});
    const rejected = await this._setQcStatus(orderId, 'rejected');
    return { orderId, rejected };
  }

  @ApiOperation({ summary: 'Inspector submit' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('inspector-submit/:orderId')
  async inspectorSubmit(@Param('orderId') orderId: string, @Body() body: unknown) {
    InspectorSubmitSchema.parse(body ?? {});
    const submitted = await this._setQcStatus(orderId, 'inspector_submitted');
    return { orderId, submitted };
  }

  @ApiOperation({ summary: 'Post inspector submit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('inspector-submit/:orderId')
  async postInspectorSubmit(@Param('orderId') orderId: string, @Body() body: unknown) {
    InspectorSubmitSchema.parse(body ?? {});
    const submitted = await this._setQcStatus(orderId, 'inspector_submitted');
    return { orderId, submitted };
  }
}
