/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employee-files-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   employee-files module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import {
  Controller, Get, Patch, Post, Delete, Param, Query, Body,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { EmployeeFilesCompatService } from './employee-files-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN'] as const;

@ApiThrottle()
@Controller('employee-files')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class EmployeeFilesCompatController {
  constructor(private readonly svc: EmployeeFilesCompatService) {}

  @Get()
  async listFiles(
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
  ) {
    return unwrapOrThrow(await this.svc.listFiles(employeeId, type));
  }

  @Post()
  async createFile(
    @Body() body: CompatBodyDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createFile(body, user.id));
  }

  @Get(':id')
  async getFile(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getFile(id));
  }

  @Patch(':id')
  async updateFile(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrThrow(await this.svc.updateFile(id, body as Record<string, unknown>));
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteFile(id));
  }
}
