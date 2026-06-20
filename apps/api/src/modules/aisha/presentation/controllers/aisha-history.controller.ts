/**
 * @module aisha-history.controller
 * @description Read + governance surface over the AIsha history tables. Transport
 * only (Qoida 6): validates query/params with Zod, resolves the caller's userId
 * from the JWT, delegates to AishaHistoryService, and unwraps Result<T>.
 *
 * Routes (all under /api/aisha, JwtAuthGuard):
 *   GET  /api/aisha/conversations              — caller's conversations (paginated)
 *   GET  /api/aisha/conversations/:id          — one conversation + tool-call transcript
 *   GET  /api/aisha/approvals?status=pending   — HITL queue (caller-scoped)
 *   POST /api/aisha/approvals/:id/approve      — flip approval → approved (real UPDATE)
 *   POST /api/aisha/approvals/:id/reject       — flip approval → rejected (real UPDATE)
 */

import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { unwrapOrThrow } from '@common/http-result';
import { AishaHistoryService } from '../../application/conversation/aisha-history.service';

interface AuthedReq extends FastifyRequest {
  user?: { id?: number; userId?: number; sub?: number; role?: string };
}

const ListQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const ApprovalsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

const UuidParamSchema = z.string().uuid();

@ApiTags('AIsha History')
@ApiBearerAuth()
@Controller('aisha')
@UseGuards(JwtAuthGuard)
export class AishaHistoryController {
  constructor(private readonly history: AishaHistoryService) {}

  private userIdOf(req: AuthedReq): number {
    return req.user?.userId ?? req.user?.id ?? req.user?.sub ?? 0;
  }

  @ApiOperation({ summary: 'List conversations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('conversations')
  async listConversations(@Query() query: unknown, @Req() req: AuthedReq) {
    const { page, limit } = ListQuerySchema.parse(query);
    const result = await this.history.listConversations(this.userIdOf(req), page, limit);
    return { success: true, data: unwrapOrThrow(result) };
  }

  @ApiOperation({ summary: 'Get one conversation + transcript' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @Req() req: AuthedReq) {
    const convId = UuidParamSchema.parse(id);
    const result = await this.history.getConversation(this.userIdOf(req), convId);
    return { success: true, data: unwrapOrThrow(result) };
  }

  @ApiOperation({ summary: 'List approvals (HITL queue)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('approvals')
  async listApprovals(@Query() query: unknown, @Req() req: AuthedReq) {
    const { status, page, limit } = ApprovalsQuerySchema.parse(query);
    const result = await this.history.listApprovals(this.userIdOf(req), status ?? null, page, limit);
    return { success: true, data: unwrapOrThrow(result) };
  }

  @ApiOperation({ summary: 'Approve a pending action' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('approvals/:id/approve')
  async approve(@Param('id') id: string, @Req() req: AuthedReq) {
    const approvalId = UuidParamSchema.parse(id);
    const result = await this.history.approve(this.userIdOf(req), approvalId);
    return { success: true, data: unwrapOrThrow(result) };
  }

  @ApiOperation({ summary: 'Reject a pending action' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('approvals/:id/reject')
  async reject(@Param('id') id: string, @Req() req: AuthedReq) {
    const approvalId = UuidParamSchema.parse(id);
    const result = await this.history.reject(this.userIdOf(req), approvalId);
    return { success: true, data: unwrapOrThrow(result) };
  }
}
