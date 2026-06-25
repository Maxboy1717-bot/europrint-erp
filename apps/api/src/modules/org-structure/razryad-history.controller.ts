/**
 * @module razryad-history.controller
 * @description HTTP routes — razryad o'sish/pasayish EXECUTION (FAZA-03, EP-ORG-010..013).
 *   2-imzo: hr-approve (HR) -> manager-approve (bevosita rahbar) -> razryad o'zgaradi + tarix.
 */

import {
  Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { RazryadHistoryService } from './razryad-history.service';

const CreateRequestSchema = z.object({
  targetRazryadId: z.number().int().positive(),
  requestType:     z.enum(['increase', 'decrease']),
  examScore:       z.number().min(0).max(100).optional(),
  reason:          z.string().max(2000).optional(),
}).strict();

const RejectSchema = z.object({ reason: z.string().min(1).max(2000) }).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin', 'supervisor', 'viewer')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Razryad Execution')
@ApiBearerAuth()
@Controller('org-structure')
export class RazryadHistoryController {
  private readonly logger = new Logger(RazryadHistoryController.name);
  constructor(private readonly service: RazryadHistoryService) {}

  @ApiOperation({ summary: 'Karta razryad tarixi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cards/:cardId/razryad-history')
  async history(@Param('cardId', ParseIntPipe) cardId: number) {
    const data = unwrapOrInternal(await this.service.historyByCard(cardId));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "Karta razryad so'rovlari" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cards/:cardId/razryad-requests')
  async requestsByCard(@Param('cardId', ParseIntPipe) cardId: number) {
    const data = unwrapOrInternal(await this.service.listRequestsByCard(cardId));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "Kutilayotgan razryad so'rovlari" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('hr_manager', 'manager', 'director', 'super_admin')
  @Get('razryad-requests/pending')
  async pending() {
    const data = unwrapOrInternal(await this.service.listPendingRequests());
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "Razryad o'sish/pasayish so'rovi" })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Validation/guard' })
  @Roles('hr_manager', 'manager', 'director', 'super_admin')
  @Post('cards/:cardId/razryad-requests')
  async createRequest(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = CreateRequestSchema.parse(body);
    const requestedBy = user?.id ?? user?.sub ?? null;
    return unwrapOrThrow(await this.service.createRequest({
      cardId,
      targetRazryadId: dto.targetRazryadId,
      requestType:     dto.requestType,
      examScore:       dto.examScore ?? null,
      reason:          dto.reason ?? null,
      requestedBy:     requestedBy == null ? null : Number(requestedBy),
      aiSuggested:     false,
    }));
  }

  @ApiOperation({ summary: 'HR imzosi (1-imzo)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('hr_manager', 'super_admin')
  @Post('razryad-requests/:id/hr-approve')
  async hrApprove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const uid = Number(user?.id ?? user?.sub ?? 0);
    return unwrapOrThrow(await this.service.hrApprove(id, uid));
  }

  @ApiOperation({ summary: "Bevosita rahbar imzosi (2-imzo) -> razryad o'zgaradi" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('manager', 'director', 'super_admin')
  @Post('razryad-requests/:id/manager-approve')
  async managerApprove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const uid = Number(user?.id ?? user?.sub ?? 0);
    return unwrapOrThrow(await this.service.managerApprove(id, uid));
  }

  @ApiOperation({ summary: "Razryad so'rovini rad etish" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('razryad-requests/:id/reject')
  async reject(@Param('id', ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = RejectSchema.parse(body);
    const uid = Number(user?.id ?? user?.sub ?? 0);
    return unwrapOrThrow(await this.service.reject(id, uid, dto.reason));
  }
}
