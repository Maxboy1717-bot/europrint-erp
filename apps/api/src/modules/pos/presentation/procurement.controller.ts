/**
 * POS — Ta'minot (P2P) Controller
 * Xarid-to'lov zanjiri endpointlari.
 * Increment 1.2: org-sxema bo'yicha xarid tasdiq zanjirini ko'rsatish (eng yaqin rahbar → direktor).
 */
import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
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

  /** Xarid so'rovi tafsilotlari (qatorlar + tasdiq bosqichlari). */
  @Get('requests/:id')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: "Xarid so'rovi tafsilotlari" })
  async getRequest(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.requestService.getRequest(id));
  }
}
