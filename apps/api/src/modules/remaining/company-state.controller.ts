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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('company-state')
@UseGuards(RolesGuard)
@Roles('director', 'manager', 'super_admin', 'admin', 'cfo', 'finance_manager', 'ceo')
export class CompanyStateController {
  constructor(private readonly svc: CompanyStateService) {}

  @Get('current')
  async getCurrent() {
    return unwrapOrThrow(await this.svc.getCurrent());
  }
}
