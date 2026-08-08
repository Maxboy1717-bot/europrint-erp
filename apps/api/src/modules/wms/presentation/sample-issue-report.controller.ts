/**
 * @module sample-issue-report.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *   Vision 10-warehouse #29 — namuna/probnik chiqim hisobotda alohida ko'rsatiladi (sample-issue tagging).
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { SampleIssueReportService } from '../application/sample-issue-report.service';

// WMS namuna-chiqim hisobotini o'qiydigan rollar (advance-linkage bilan bir xil naqsh).
// RolesGuard case-insensitive + fail-closed.
const SAMPLE_ISSUE_READ_ROLES = [
  'director', 'super_admin', 'finance_manager', 'finance',
  'warehouse_manager', 'mm_manager', 'warehouse_keeper',
];

@ApiThrottle()
@ApiTags('Wms Sample Issues')
@Controller('wms/sample-issues')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SAMPLE_ISSUE_READ_ROLES)
export class SampleIssueReportController {
  constructor(private readonly svc: SampleIssueReportService) {}

  // Vision 10-warehouse #29 — namuna-teglangan (reason='NAMUNA') chiqimlar ro'yxati.
  @ApiOperation({ summary: "Sample/probnik ('NAMUNA') warehouse issues, most recent first" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async listSampleIssues(
    @Query('sinceDays') sinceDays?: string,
    @Query('limit') limit?: string,
  ) {
    const r = await this.svc.listSampleIssues(safeInt(sinceDays, 90), safeInt(limit, 200));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  // Vision 10-warehouse #29 — oylik namuna-chiqim yig'indisi + 10kg/oy signal bayrog'i.
  @ApiOperation({ summary: 'Monthly sample-issue roll-up with over-threshold flag (default 10 kg/month)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('monthly')
  async monthlySummary(@Query('months') months?: string) {
    const r = await this.svc.monthlySummary(safeInt(months, 6));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }
}
