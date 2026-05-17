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
import {
  OrgFlatDeptAclTranslator,
  type LegacyOrgFlatDeptRow,
  type OrgFlatDeptDto,
} from './acl/org-flat-dept-acl';

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
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly flatAcl = new OrgFlatDeptAclTranslator();

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

  /**
   * PA2-14 ACL-translated variant of the flat department list. New BC-3
   * consumers should target this route; `/flat` stays for backwards-compat.
   */
  @Get('flat/v2')
  async getOrgFlatV2(@Query('departmentId') departmentId?: string): Promise<OrgFlatDeptDto[]> {
    const rows = unwrapOrInternal(await this.svc.getOrgFlat(departmentId)) as unknown as LegacyOrgFlatDeptRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.flatAcl.toDomain(row))
      .filter((r): r is { ok: true; data: OrgFlatDeptDto } => r.ok)
      .map((r) => r.data);
  }
}
