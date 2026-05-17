/**
 * @module cfo.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, UseGuards, Get , UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { CfoCompatService } from './cfo.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import {
  CfoCashPositionAclTranslator,
  type LegacyCfoCashPositionRow,
  type CfoCashPositionDto,
} from './acl/cfo-cash-position-acl';

@ApiTags('CFO Dashboard (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('cfo')
export class CfoCompatController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly cashPositionAcl = new CfoCashPositionAclTranslator();

  constructor(private readonly svc: CfoCompatService) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('cash-position')
  async getCashPosition() {
    return unwrapOrInternal(await this.svc.getCashPosition());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-7 (Finance / CFO) consumers should
   * target this endpoint; the legacy `/cash-position` route stays for
   * backwards-compat.
   */
  @Get('cash-position/v2')
  async getCashPositionV2(): Promise<CfoCashPositionDto | null> {
    const raw = unwrapOrInternal(await this.svc.getCashPosition()) as unknown as LegacyCfoCashPositionRow;
    const r = this.cashPositionAcl.toDomain(raw);
    return r.ok ? r.data : null;
  }

  @Get('profitability')
  async getProfitability() {
    return unwrapOrInternal(await this.svc.getProfitability());
  }

  @Get('profitability-trend')
  async getProfitabilityTrend() {
    return unwrapOrInternal(await this.svc.getProfitabilityTrend());
  }

  @Get('financial-risk')
  async getFinancialRisk() {
    return unwrapOrInternal(await this.svc.getFinancialRisk());
  }
}
