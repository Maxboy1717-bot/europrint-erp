/**
 * @module export.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Res, UseGuards, UseInterceptors, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { ExportService } from './export.service';
import type { FastifyReply } from 'fastify';
import { Readable } from 'stream';

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
  async exportEmployeesCsv(@Res({ passthrough: true }) res: FastifyReply): Promise<StreamableFile> {
    const csv = unwrapOrInternal(await this.exportSvc.getEmployeesCsv());
    const filename = `employees-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  @Get('attendance/csv')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export attendance records (30 days) as CSV' })
  async exportAttendanceCsv(@Res({ passthrough: true }) res: FastifyReply): Promise<StreamableFile> {
    const csv = unwrapOrInternal(await this.exportSvc.getAttendanceCsv());
    const filename = `attendance-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  @Get('discipline/csv')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export disciplinary actions as CSV' })
  async exportDisciplineCsv(@Res({ passthrough: true }) res: FastifyReply): Promise<StreamableFile> {
    const csv = unwrapOrInternal(await this.exportSvc.getDisciplineCsv());
    const filename = `discipline-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  @Get('hr-stats/pdf')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export HR statistics as PDF' })
  async exportHrStatsPdf(@Res({ passthrough: true }) res: FastifyReply): Promise<StreamableFile> {
    const bytes = unwrapOrInternal(await this.exportSvc.getHrStatsPdf());
    const filename = `hr-stats-${_time.now().toISOString().slice(0,10)}.pdf`;
    void res.header('Content-Type', 'application/pdf').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(bytes)));
  }

  @Get('hr-stats/excel')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Export HR statistics as CSV (Excel-compatible)' })
  async exportHrStatsExcel(@Res({ passthrough: true }) res: FastifyReply): Promise<StreamableFile> {
    const buf = unwrapOrInternal(await this.exportSvc.getHrStatsExcel());
    const filename = `hr-stats-${_time.now().toISOString().slice(0,10)}.csv`;
    void res.header('Content-Type', 'application/vnd.ms-excel; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(buf));
  }
}
