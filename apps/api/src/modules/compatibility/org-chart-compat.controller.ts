/**
 * OrgChartCompatController — `/api/org-chart/*` endpoint'lari.
 *
 * Frontend `OrgChartPage.tsx` ishlatadi.
 * Auth: JWT + Role-based (yangi RBAC R4 dan keyin @RequirePermission'ga o'tadi).
 *
 * MUHIM: Avvalgi versiyada faqat `RolesGuard` bor edi (JwtAuthGuard yo'q),
 * shu sababli `req.user` undefined bo'lardi va RolesGuard har doim 403 berardi.
 */
import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { OrgChartCompatService } from './org-chart-compat.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('org-chart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'super_admin', 'admin', 'director', 'manager',
  'hr_manager', 'hr_specialist',
  // Backward-compat: legacy uppercase roles
  'SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGER', 'HR_MANAGER', 'HR_SPECIALIST',
)
export class OrgChartCompatController {
  constructor(private readonly svc: OrgChartCompatService) {}

  /**
   * GET /api/org-chart/tree — hierarchical bo'limlar daraxti + stats.
   */
  @Get('tree')
  async getOrgTree(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getOrgTree(departmentId));
  }

  /**
   * GET /api/org-chart/flat — bo'limlar yassi ro'yxati.
   */
  @Get('flat')
  async getOrgFlat(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getOrgFlat(departmentId));
  }
}
