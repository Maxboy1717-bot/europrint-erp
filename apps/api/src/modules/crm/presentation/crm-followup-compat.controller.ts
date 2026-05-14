/**
 * @module crm-followup-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Query,
  UseInterceptors,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CrmFollowupCompatService } from '../application/crm-followup-compat.service';
import { safeInt } from '../../hr/common/db-rows';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('crm/followup-activities')
export class CrmFollowupCompatController {
  private readonly logger = new Logger(CrmFollowupCompatController.name);

  constructor(private readonly svc: CrmFollowupCompatService) {}

  @Get()
  async list(@Query('leadId') leadId?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    const lid = leadId ? parseInt(leadId, 10) || null : null;
    return unwrapOrThrow(await this.svc.list(lid, lim, off));
  }

  @Get('today')
  async today() {
    return unwrapOrThrow(await this.svc.today());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.svc.update(safeInt(id, 0), body));
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.svc.delete(safeInt(id, 0));
    return {};
  }
}
