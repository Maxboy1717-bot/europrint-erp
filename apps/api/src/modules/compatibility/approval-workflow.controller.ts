/**
 * @module approval-workflow.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { z } from 'zod';
import { ApprovalWorkflowService } from './approval-workflow.service';
import {
  ApprovalRequestAclTranslator,
  type LegacyApprovalRow,
  type ApprovalRequestDto,
} from './acl/approval-request-acl';

const ApproveSchema = z.object({ notes: z.string().optional() });
const RejectSchema  = z.object({ rejectionReason: z.string().min(1) });

const CreateSchema = z.object({
  documentType:   z.string().min(1),
  documentId:     z.string().min(1),
  documentNumber: z.string().optional(),
  amount:         z.number().default(0),
  currency:       z.string().default('UZS'),
  requestedBy:    z.string().min(1),
  notes:          z.string().optional(),
});

const BulkApproveSchema = z.object({ ids: z.array(z.string()).min(1) });

type TokenUser = { id: string; sub?: string };

@ApiTags('Approval Workflow')
@ApiBearerAuth()
@Roles('super_admin', 'admin', 'director', 'manager', 'accountant')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('approval-workflow')
export class ApprovalWorkflowController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly acl = new ApprovalRequestAclTranslator();

  constructor(private readonly svc: ApprovalWorkflowService) {}

  @Get()
  async getAll() {
    return unwrapOrBadRequest(await this.svc.getPending());
  }

  /**
   * PA2-14 ACL-translated variant of pending approvals. New BC-7 (Finance)
   * consumers should target this route; `/pending` stays for backwards-compat.
   */
  @Get('pending/v2')
  async getPendingV2(): Promise<ApprovalRequestDto[]> {
    const rows = unwrapOrBadRequest(await this.svc.getPending()) as unknown as LegacyApprovalRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.acl.toDomain(row))
      .filter((r): r is { ok: true; data: ApprovalRequestDto } => r.ok)
      .map((r) => r.data);
  }

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrBadRequest(await this.svc.getDashboard());
  }

  @Get('order')
  async getOrder(@Query('documentType') type?: string, @Query('documentId') docId?: string) {
    return type && docId
      ? unwrapOrBadRequest(await this.svc.getByDocType(type, docId))
      : unwrapOrBadRequest(await this.svc.getPending());
  }

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  async submit(@Body() body: unknown) {
    const dto = CreateSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.create(dto));
  }

  @Post('approve/:id')
  @HttpCode(HttpStatus.OK)
  async approveById(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: TokenUser) {
    const dto = ApproveSchema.parse(body ?? {});
    const approvedBy = user?.id ?? user?.sub ?? 'system';
    return unwrapOrNotFound(await this.svc.approve(id, approvedBy, dto.notes));
  }

  @Post('reject/:id')
  @HttpCode(HttpStatus.OK)
  async rejectById(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: TokenUser) {
    const dto = RejectSchema.parse(body);
    const rejectedBy = user?.id ?? user?.sub ?? 'system';
    return unwrapOrNotFound(await this.svc.reject(id, rejectedBy, dto.rejectionReason));
  }

  @Get('pending')
  async getPending() {
    return unwrapOrBadRequest(await this.svc.getPending());
  }

  @Get('history')
  async getHistory() {
    return unwrapOrBadRequest(await this.svc.getHistory());
  }

  @Get('by-type')
  async getByType(@Query('type') type: string) {
    return unwrapOrBadRequest(await this.svc.getByType(type));
  }

  @Post('bulk-approve')
  @HttpCode(HttpStatus.OK)
  @Roles('super_admin', 'admin', 'director')
  async bulkApprove(@Body() body: unknown, @CurrentUser() user: TokenUser) {
    const { ids } = BulkApproveSchema.parse(body);
    const approvedBy = user?.id ?? user?.sub ?? 'system';
    return unwrapOrBadRequest(await this.svc.bulkApprove(ids, approvedBy));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const dto = CreateSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.create(dto));
  }

  @Get(':type/:docId/requests')
  async getByDocType(@Param('type') type: string, @Param('docId') docId: string) {
    return unwrapOrBadRequest(await this.svc.getByDocType(type, docId));
  }

  @Post(':type/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('type') _type: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: TokenUser,
  ) {
    const dto = ApproveSchema.parse(body ?? {});
    const approvedBy = user?.id ?? user?.sub ?? 'system';
    return unwrapOrNotFound(await this.svc.approve(id, approvedBy, dto.notes));
  }

  @Post(':type/:id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('type') _type: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: TokenUser,
  ) {
    const dto = RejectSchema.parse(body);
    const rejectedBy = user?.id ?? user?.sub ?? 'system';
    return unwrapOrNotFound(await this.svc.reject(id, rejectedBy, dto.rejectionReason));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getById(id));
  }
}
