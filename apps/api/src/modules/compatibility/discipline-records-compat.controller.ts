/**
 * @module discipline-records-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   discipline-records module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { DisciplineRecordsCompatService } from './discipline-records-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('discipline-records')
export class DisciplineRecordsCompatController {
  constructor(private readonly svc: DisciplineRecordsCompatService) {}

  @Get()
  async getDisciplineRecords(
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.getDisciplineRecords(employeeId, type, status));
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
