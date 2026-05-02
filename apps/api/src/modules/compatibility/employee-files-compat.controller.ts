import {
  Controller, Get, Post, Delete, Param, Query, Body,
  UseGuards, UseInterceptors, InternalServerErrorException,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { EmployeeFilesCompatService } from './employee-files-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteFile(id));
  }
}
