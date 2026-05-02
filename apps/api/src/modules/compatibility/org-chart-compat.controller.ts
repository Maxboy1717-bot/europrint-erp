import { Controller, Get, Query, UseGuards , UseInterceptors} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { OrgChartCompatService } from './org-chart-compat.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('org-chart')
@UseGuards(RolesGuard)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class OrgChartCompatController {
  constructor(private readonly svc: OrgChartCompatService) {}

  @Get('tree')
  async getOrgTree(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getOrgTree(departmentId));
  }

  @Get('flat')
  async getOrgFlat(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getOrgFlat(departmentId));
  }
}
