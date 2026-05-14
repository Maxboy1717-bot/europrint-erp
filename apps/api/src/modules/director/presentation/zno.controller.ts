/**
 * @module zno.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Body, Controller, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ZnoService } from '../application/zno.service';
import {
  ZnoCreateSchema, ZnoCreateDto,
  ZnoCommentSchema, ZnoCommentDto,
  ZnoUpdateSchema, ZnoUpdateDto,
} from './dto/director.dto';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const APPROVE_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager', 'finance'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('hr/zno')
export class ZnoController {
  private readonly logger = new Logger(ZnoController.name);

  constructor(private readonly svc: ZnoService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ZnoCreateSchema))
  async createZno(
    @Body() body: ZnoCreateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createZnoWithValidation(body, user.id));
  }

  @Get()
  async listZno(
    @Query('status') status?: string,
    @Query('department_id') departmentId?: string,
    @Query('limit') limit?: string,
  ) {
    const maxRows = Math.min(parseInt(limit ?? '50') || 50, MAX_QUERY_LIMIT);
    return unwrapOrInternal(await this.svc.listZno(status ?? null, departmentId ? parseInt(departmentId, 10) : null, maxRows));
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(...APPROVE_ROLES)
  @UsePipes(new ZodValidationPipe(ZnoCommentSchema))
  async approveZno(
    @Param('id') id: string,
    @Body() body: ZnoCommentDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.approveZnoWithAuth(parseInt(id, 10), user.id, (body.comment as string) ?? null));
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(...APPROVE_ROLES)
  @UsePipes(new ZodValidationPipe(ZnoCommentSchema))
  async rejectZno(
    @Param('id') id: string,
    @Body() body: ZnoCommentDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.rejectZnoWithAuth(parseInt(id, 10), user.id, (body.comment as string) ?? null));
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...APPROVE_ROLES)
  @UsePipes(new ZodValidationPipe(ZnoUpdateSchema))
  async updateZno(
    @Param('id') id: string,
    @Body() body: ZnoUpdateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { status, comment } = body as Record<string, string>;
    return unwrapOrThrow(await this.svc.updateZnoWithAuth(parseInt(id, 10), status ?? null, comment ?? null, user.id));
  }
}
