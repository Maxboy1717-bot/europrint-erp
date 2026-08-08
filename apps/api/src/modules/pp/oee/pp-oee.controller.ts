/**
 * @module pp-oee.controller
 * @description Operation queue-time surface (vision 07-pp#46) -- queue (waiting-for-next-stage)
 *   time is tracked distinct from active work time and EXCLUDED from the OEE availability
 *   denominator.
 *
 *   POST /api/pp/oee/operations/:id/queued  -- stamp queued_at (idempotent; op enters queue)
 *   GET  /api/pp/oee/queue-exclusion        -- per-work-center OEE denominator (queue excluded)
 *
 *   Auth mirrors the sibling PP reason-codes surface: JwtAuthGuard + RolesGuard; reads open to
 *   the PP read tier, the queued-stamp write gated to the production write tier. Transport-only
 *   (Rule 6): validate with Zod, delegate to the service, unwrap Result.
 */

import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow, unwrapOrNotFoundDefined } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { PpQueueTimeService } from './pp-queue-time.service';

// Read tier mirrors pp-reason-codes: any planner/production role can read the OEE split.
const PP_OEE_READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
// Write tier mirrors the sibling master-data write set: stamp queued_at.
const PP_OEE_WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER];

// z.coerce.date accepts ISO strings ("2026-07-01T00:00:00Z") and validates them to Date;
// the controller re-serialises to ISO for the repo (no Date arithmetic here -- Rule 6).
const WindowSchema = z
  .object({ from: z.coerce.date(), to: z.coerce.date() })
  .refine((d) => d.from < d.to, { message: "'from' 'to' dan oldin bo'lishi kerak", path: ['from'] });

@ApiTags('PP OEE')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/oee')
export class PpOeeController {
  constructor(private readonly svc: PpQueueTimeService) {}

  @ApiOperation({ summary: 'Stamp queued_at -- operation entered the work-center queue (idempotent)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  @Post('operations/:id/queued')
  @Roles(...PP_OEE_WRITE)
  async markQueued(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrNotFoundDefined(await this.svc.markQueued(id), 'Operatsiya topilmadi');
  }

  @ApiOperation({ summary: 'Per-work-center OEE availability denominator with queue time excluded' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad window' })
  @Get('queue-exclusion')
  @Roles(...PP_OEE_READ)
  async queueExclusion(@Query() query: unknown) {
    const { from, to } = WindowSchema.parse(query);
    return unwrapOrThrow(await this.svc.getQueueExclusion(from.toISOString(), to.toISOString()));
  }
}
