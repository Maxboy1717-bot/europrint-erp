/**
 * @module open-pr-warning.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *   Vision 10-warehouse #4 — Ochiq PR miqdori ogohlantirish bayrog'i (open-PR-quantity warning flag).
 */
import { Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { OpenPrWarningService } from '../application/open-pr-warning.service';

// WMS + procurement read/act roles (RolesGuard case-insensitive + fail-closed; matches sibling WMS controllers).
const OPEN_PR_WARNING_ROLES = [
  'director', 'super_admin', 'mm_manager', 'warehouse_manager', 'warehouse_keeper', 'procurement',
];

@ApiThrottle()
@ApiTags('Wms Open PR Warning')
@Controller('wms/open-pr-warning')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...OPEN_PR_WARNING_ROLES)
export class OpenPrWarningController {
  constructor(private readonly svc: OpenPrWarningService) {}

  // Vision 10-warehouse #4 — list PRs with an open (unfulfilled) quantity warning.
  @ApiOperation({ summary: 'Purchase requests flagged with an open (unfulfilled) quantity (ochiq PR miqdori)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('warnings')
  async listWarnings(@Query('limit') limit?: string) {
    const r = await this.svc.listOpenWarnings(safeInt(limit, 100));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  // Comparison job: recompute the open-qty warning flag. Does NOT auto-edit PR quantities — only flags.
  @ApiOperation({ summary: 'Recompute open-PR-quantity warning flags (comparison job)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('recompute')
  async recompute() {
    const r = await this.svc.recompute();
    const changed = r.ok && r.data ? r.data.changed : 0;
    return { ok: r.ok, changed };
  }
}
