/**
 * @module zno.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Body, Controller, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Zno')
@Controller('hr/zno')
export class ZnoController {
  private readonly logger = new Logger(ZnoController.name);

  constructor(private readonly svc: ZnoService) {}

  @ApiOperation({ summary: 'Create zno' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(...APPROVE_ROLES)
  @UsePipes(new ZodValidationPipe(ZnoCreateSchema))
  async createZno(
    @Body() body: ZnoCreateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createZnoWithValidation(body, user.id));
  }

  @ApiOperation({ summary: 'List zno' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @UseGuards(RolesGuard)
  @Roles(...APPROVE_ROLES)
  async listZno(
    @Query('status') status?: string,
    @Query('department_id') departmentId?: string,
    @Query('limit') limit?: string,
  ) {
    const maxRows = Math.min(parseInt(limit ?? '50') || 50, MAX_QUERY_LIMIT);
    return unwrapOrInternal(await this.svc.listZno(status ?? null, departmentId ? parseInt(departmentId, 10) : null, maxRows));
  }

  @ApiOperation({ summary: 'Approve zno' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Reject zno' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Update zno' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
