/**
 * @module document-workflow-v2.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   document-workflow-v2 module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import {
  Controller, Get, Post, Body, Param, Query, ParseIntPipe,
  UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { DocumentWorkflowV2Service } from './document-workflow-v2.service';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'super_admin', 'admin', 'director', 'manager', 'employee',
  'SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGER', 'HR_MANAGER',
)
@Controller('hr-v2/workflow')
export class DocumentWorkflowV2Controller {
  constructor(
    private readonly svc: DocumentWorkflowV2Service,
    private readonly i18n: I18nService,
  ) {}

  /**
   * GET /api/hr-v2/workflow/routes
   * Mavjud workflow shablonlari (leave_request, advance, contract, ...)
   */
  @Get('routes')
  async listRoutes() {
    return unwrapOrInternal(await this.svc.listRoutes());
  }

  /**
   * POST /api/hr-v2/workflow/initiate
   * Yangi hujjat workflow boshlash.
   *
   * Body: { employeeId, documentType, title, description?, fileUrl? }
   */
  @Post('initiate')
  async initiate(
    @Body() body: {
      employeeId?: number;
      documentType?: string;
      title?: string;
      description?: string;
      fileUrl?: string;
    },
    @CurrentUser() user: { id: number },
  ) {
    if (!body.employeeId) throw new BadRequestException(await this.i18n.t('errors.employeeIdRequired'));
    if (!body.documentType) throw new BadRequestException(await this.i18n.t('errors.documentTypeRequired'));
    if (!body.title) throw new BadRequestException(await this.i18n.t('errors.titleRequired'));

    return unwrapOrInternal(
      await this.svc.initiateDocument({
        employeeId: Number(body.employeeId),
        documentType: body.documentType,
        title: body.title,
        description: body.description,
        fileUrl: body.fileUrl,
        initiatorId: user.id,
      }),
    );
  }

  /**
   * POST /api/hr-v2/workflow/:instanceId/approve
   */
  @Post(':instanceId/approve')
  async approve(
    @Param('instanceId', ParseIntPipe) instanceId: number,
    @Body() body: { comment?: string },
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrInternal(await this.svc.approveStep(instanceId, user.id, body.comment));
  }

  /**
   * POST /api/hr-v2/workflow/:instanceId/reject
   * Body: { reason } — kamida 10 belgi (Q82 — sabab majburiy)
   */
  @Post(':instanceId/reject')
  async reject(
    @Param('instanceId', ParseIntPipe) instanceId: number,
    @Body() body: { reason?: string },
    @CurrentUser() user: { id: number },
  ) {
    if (!body.reason) {
      throw new BadRequestException(await this.i18n.t('errors.rejectReasonRequired'));
    }
    return unwrapOrInternal(await this.svc.rejectStep(instanceId, user.id, body.reason));
  }

  /**
   * GET /api/hr-v2/workflow/employee/:id/documents
   */
  @Get('employee/:employeeId/documents')
  async getEmployeeDocuments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.svc.getEmployeeDocuments(employeeId));
  }

  /**
   * GET /api/hr-v2/workflow/pending
   * Approver'ning kutib turgan hujjatlari.
   */
  @Get('pending')
  async getPending(@CurrentUser() user: { id: number }, @Query('userId') userId?: string) {
    const targetId = userId ? parseInt(userId, 10) : user.id;
    return unwrapOrInternal(await this.svc.getPendingApprovals(targetId));
  }
}
