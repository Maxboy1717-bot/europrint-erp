/**
 * @module discipline-records-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { DisciplineRecordsCompatService } from './discipline-records-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';
import {
  DisciplineRecordAclTranslator,
  type LegacyDisciplineRecordRow,
  type DisciplineRecordDto,
} from './acl/discipline-record-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('discipline-records')
export class DisciplineRecordsCompatController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly acl = new DisciplineRecordAclTranslator();

  constructor(private readonly svc: DisciplineRecordsCompatService) {}

  @Get()
  async getDisciplineRecords(
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.getDisciplineRecords(employeeId, type, status));
  }

  /**
   * PA2-14 ACL-translated variant. New BC-3 (HR) consumers should target this
   * endpoint; the legacy `GET /discipline-records` stays for backwards-compat.
   */
  @Get('v2')
  async getDisciplineRecordsV2(
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ): Promise<DisciplineRecordDto[]> {
    const rows = unwrapOrInternal(
      await this.svc.getDisciplineRecords(employeeId, type, status),
    ) as unknown as LegacyDisciplineRecordRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.acl.toDomain(row))
      .filter((r): r is { ok: true; data: DisciplineRecordDto } => r.ok)
      .map((r) => r.data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDisciplineRecord(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createDisciplineRecord(body));
  }

  @Get(':id')
  async getDisciplineRecord(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getDisciplineRecord(id));
  }

  @Put(':id')
  async updateDisciplineRecord(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateDisciplineRecord(id, body));
  }

  @Delete(':id')
  async deleteDisciplineRecord(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteDisciplineRecord(id));
  }
}
