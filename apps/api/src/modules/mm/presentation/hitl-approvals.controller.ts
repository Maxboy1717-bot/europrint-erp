/**
 * @module hitl-approvals.controller
 * @description NestJS controller. HTTP route handlers; delegates to the repository and returns
 * unwrapped Result data.
 *
 * WHY THIS CONTROLLER EXISTS (dead-end fix)
 *   `hitl_approvals` is populated by three MM listeners (PoRequiresDirectorApprovalListener,
 *   ThreeWayMatchFailedListener, OrderMaterialWaitingListener) but, until this controller, no
 *   endpoint could ever move a row out of 'pending' — every review item was a dead-end
 *   notification. Mirrors the director `approval_requests` approve/reject pattern
 *   (`director/presentation/approvals.controller.ts`), scoped to the simpler hitl_approvals shape.
 */

import { Body, Controller, Get, Inject, Logger, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HITL_APPROVALS_REPO, IHitlApprovalsRepo } from '../domain/repositories/i-hitl-approvals.repo';
import { HitlApproveDtoSchema, HitlRejectDtoSchema } from './dto/hitl-approval.dto';

enum Role {
  PURCHASE_MANAGER = 'purchase_manager',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

@ApiTags('MM — HITL Approvals')
@ApiBearerAuth()
@ApiThrottle()
@Controller('hitl-approvals')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class HitlApprovalsController {
  private readonly logger = new Logger(HitlApprovalsController.name);

  constructor(@Inject(HITL_APPROVALS_REPO) private readonly repo: IHitlApprovalsRepo) {}

  @Get()
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: "Pending HITL review-queue items (PO director-approval, 3-way-match failure, SD material-waiting)" })
  @ApiResponse({ status: 200, description: 'OK' })
  async listPending(@Query('limit') limit?: string) {
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const result = await this.repo.listPending(lim);
    return { items: unwrapOrThrow(result) };
  }

  @Post(':id/approve')
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Approve a pending HITL review item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Not pending' })
  async approve(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = HitlApproveDtoSchema.parse(body ?? {});
    const result = await this.repo.approve(Number(id), String(user.id), dto.notes ?? null);
    this.logger.log(`HITL #${id} approve requested by user ${user.id}`);
    return unwrapOrThrow(result);
  }

  @Post(':id/reject')
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Reject a pending HITL review item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Not pending' })
  async reject(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = HitlRejectDtoSchema.parse(body ?? {});
    const result = await this.repo.reject(Number(id), String(user.id), dto.reason ?? null);
    this.logger.log(`HITL #${id} reject requested by user ${user.id}`);
    return unwrapOrThrow(result);
  }
}
