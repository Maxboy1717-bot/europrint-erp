/**
 * @module company-state.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CompanyStateService } from './company-state.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  CompanyStateAclTranslator,
  type LegacyCompanyStateRow,
  type CompanyStateDto,
} from './acl/company-state-acl';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('company-state')
@UseGuards(RolesGuard)
@Roles('director', 'manager', 'super_admin', 'admin', 'cfo', 'finance_manager', 'ceo')
export class CompanyStateController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly stateAcl = new CompanyStateAclTranslator();

  constructor(private readonly svc: CompanyStateService) {}

  @Get('current')
  async getCurrent() {
    return unwrapOrThrow(await this.svc.getCurrent());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-9 (Director / Strategy) consumers
   * should target this endpoint; the legacy `/current` route stays for
   * backwards-compat.
   */
  @Get('current/v2')
  async getCurrentV2(): Promise<CompanyStateDto | null> {
    const raw = unwrapOrThrow(await this.svc.getCurrent()) as unknown as LegacyCompanyStateRow;
    const r = this.stateAcl.toDomain(raw);
    return r.ok ? r.data : null;
  }
}
