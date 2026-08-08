/**
 * @module export.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Res, UseGuards, UseInterceptors, StreamableFile, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { db } from '@shared/db';
import { auditLogs as auditLogsTable } from '@shared/db/schema-rbac';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { ExportService } from './export.service';
import type { FastifyReply } from 'fastify';
import { Readable } from 'stream';

/**
 * Best-effort export-audit write to `audit_logs` (storage logDownloadAttempt naqshi)
 * — never throws (logging must not break the export pipeline). Needed because the
 * class-level AuditInterceptor SKIPS GET requests, so these 5 GET export endpoints
 * would otherwise leave no audit trail (kim, qaysi export, qachon).
 */
async function logExportAttempt(exportName: string, user?: AuthenticatedUser): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      tableName: 'export',
      recordId: exportName,
      action: 'EXPORT',
      reason: `Eksport: ${exportName} — rol "${user?.role ?? 'noma\'lum'}"`,
      userId: user?.id != null ? String(user.id) : undefined,
      userFullName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined : undefined,
      userRole: user?.role,
    });
  } catch (e) {
    Logger.warn(`Export audit-log write failed: ${String(e)}`, 'ExportController');
  }
}

@ApiTags('Export')
@ApiBearerAuth()
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('export')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ExportController {
  constructor(private readonly exportSvc: ExportService) {}

  @Get('employees/csv')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export employees list as CSV' })
  async exportEmployeesCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    await logExportAttempt('employees/csv', user);
    const csv = unwrapOrInternal(await this.exportSvc.getEmployeesCsv());
    const filename = `employees-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  @Get('attendance/csv')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export attendance records (30 days) as CSV' })
  async exportAttendanceCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    await logExportAttempt('attendance/csv', user);
    const csv = unwrapOrInternal(await this.exportSvc.getAttendanceCsv());
    const filename = `attendance-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  @Get('discipline/csv')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export disciplinary actions as CSV' })
  async exportDisciplineCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    await logExportAttempt('discipline/csv', user);
    const csv = unwrapOrInternal(await this.exportSvc.getDisciplineCsv());
    const filename = `discipline-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  @Get('hr-stats/pdf')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export HR statistics as PDF' })
  async exportHrStatsPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    await logExportAttempt('hr-stats/pdf', user);
    const bytes = unwrapOrInternal(await this.exportSvc.getHrStatsPdf());
    const filename = `hr-stats-${_time.now().toISOString().slice(0,10)}.pdf`;
    void res.header('Content-Type', 'application/pdf').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(bytes)));
  }

  @Get('hr-stats/excel')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export HR statistics as CSV (Excel-compatible)' })
  async exportHrStatsExcel(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    await logExportAttempt('hr-stats/excel', user);
    const buf = unwrapOrInternal(await this.exportSvc.getHrStatsExcel());
    const filename = `hr-stats-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'application/vnd.ms-excel; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(buf));
  }
}
