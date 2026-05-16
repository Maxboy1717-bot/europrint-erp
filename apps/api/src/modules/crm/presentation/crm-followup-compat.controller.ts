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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CrmFollowupCompatService } from '../application/crm-followup-compat.service';
import { safeInt } from '../../hr/common/db-rows';
import { z } from 'zod';

const FollowupSchema = z.object({
  leadId: z.union([z.string(), z.number()]).optional(),
  type: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
  status: z.string().max(50).optional(),
  assignedTo: z.union([z.string(), z.number()]).optional(),
}).passthrough();

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Crm Followup Compat')
@ApiBearerAuth()
@Controller('crm/followup-activities')
export class CrmFollowupCompatController {
  private readonly logger = new Logger(CrmFollowupCompatController.name);

  constructor(private readonly svc: CrmFollowupCompatService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('leadId') leadId?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    const lid = leadId ? parseInt(leadId, 10) || null : null;
    return unwrapOrThrow(await this.svc.list(lid, lim, off));
  }

  @ApiOperation({ summary: 'Today' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('today')
  async today() {
    return unwrapOrThrow(await this.svc.today());
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const dto = FollowupSchema.parse(body);
    return unwrapOrThrow(await this.svc.create(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = FollowupSchema.partial().parse(body);
    return unwrapOrThrow(await this.svc.update(safeInt(id, 0), dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.svc.delete(safeInt(id, 0));
    return {};
  }
}
