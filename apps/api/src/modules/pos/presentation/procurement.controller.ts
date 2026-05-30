/**
 * POS — Ta'minot (P2P) Controller
 * Xarid-to'lov zanjiri endpointlari.
 * Increment 1.2: org-sxema bo'yicha xarid tasdiq zanjirini ko'rsatish (eng yaqin rahbar → direktor).
 */
import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { unwrapOrThrow } from '@common/http-result';

import { ProcurementApprovalChainService } from '../application/services/procurement-approval-chain.service';
import { ProcurementRequestService, CreateProcurementRequestInput } from '../application/services/procurement-request.service';

@ApiTags("POS — Ta'minot (P2P)")
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/procurement')
export class ProcurementController {
  private readonly logger = new Logger(ProcurementController.name);
  constructor(
    private readonly approvalChain: ProcurementApprovalChainService,
    private readonly requestService: ProcurementRequestService,
  ) {}

  /**
   * Xodim uchun xarid so'rovi tasdiq zanjiri — org-sxema bo'yicha eng yaqin rahbardan
   * direktorgacha har bosqich tasdiqlovchisi (head_user_id).
   */
  @Get('approval-chain/:employeeId')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid so'rovi tasdiq zanjiri (org-sxema bo'yicha direktorgacha)" })
  async getApprovalChain(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrThrow(await this.approvalChain.resolveChainForEmployee(employeeId));
  }

  /** Yangi xarid so'rovi (P2P) — org-sxema tasdiq zanjiri avtomatik biriktiriladi. */
  @Post('requests')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid so'rovi yaratish (P2P) + org-sxema tasdiq zanjiri" })
  async createRequest(@Body() body: CreateProcurementRequestInput) {
    return unwrapOrThrow(await this.requestService.createRequest(body));
  }

  /** So'rovlar ro'yxati — ?status= / ?requesterEmployeeId= / ?pendingApproverUserId= (rahbar worklist). */
  @Get('requests')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid so'rovlari ro'yxati (filtr: status/requester/navbatdagi tasdiqlovchi)" })
  async listRequests(
    @Query('status') status?: string,
    @Query('requesterEmployeeId') requesterEmployeeId?: string,
    @Query('pendingApproverUserId') pendingApproverUserId?: string,
  ) {
    return unwrapOrThrow(await this.requestService.listRequests({
      status,
      requesterEmployeeId: requesterEmployeeId ? parseInt(requesterEmployeeId, 10) : undefined,
      pendingApproverUserId: pendingApproverUserId ? parseInt(pendingApproverUserId, 10) : undefined,
    }));
  }

  /** Xarid so'rovi tafsilotlari (qatorlar + tasdiq bosqichlari). */
  @Get('requests/:id')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid so'rovi tafsilotlari" })
  async getRequest(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.requestService.getRequest(id));
  }

  /** Tasdiq qadami — navbatdagi rahbar approve/reject qiladi (org-sxema bo'yicha keyingisiga o'tadi). */
  @Post('requests/:id/decide')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid so'rovi tasdiq qadami (approve/reject)" })
  async decide(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approverUserId: number; action: 'approve' | 'reject'; comments?: string },
  ) {
    return unwrapOrThrow(await this.requestService.decideApproval(id, body.approverUserId, body.action, body.comments));
  }

  /** Tovar qabul — chek + so'rov 'received' + podotchet reconcile (avans yopiladi). */
  @Post('requests/:id/receive')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid tovarini qabul qilish (chek + podotchet reconcile)" })
  async receive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { chekNumber?: string; chekAmount?: number; warehouseId?: string; notes?: string },
  ) {
    return unwrapOrThrow(await this.requestService.receiveProcurement(id, body));
  }
}
