/**
 * @module pp-plan-snapshots.controller
 * @description Director surface for the PP plan% snapshot (vision 07-pp#49).
 *   GET  /api/pp/plan-snapshots/director-status?period=daily|shift  — latest snapshot + offline flag
 *   POST /api/pp/plan-snapshots/capture                              — freeze a shift/daily snapshot
 *   Auth mirrors the sibling PP reason-codes surface: JwtAuthGuard + RolesGuard; reads open to
 *   the PP read tier, capture gated to the master-data write tier. Transport-only (Rule 6):
 *   validate with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { PpPlanSnapshotsService } from './pp-plan-snapshots.service';

// Read tier mirrors pp-reason-codes: any planner/production/director role reads the Director status.
const PP_SNAPSHOT_READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
// Capture (write) tier: only super_admin / director / production_manager may freeze a snapshot.
const PP_SNAPSHOT_WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER];

const PeriodSchema = z.enum(['shift', 'daily']);

const CaptureSchema = z
  .object({
    periodType: z.enum(['shift', 'daily']).default('daily'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date 'YYYY-MM-DD' formatda bo'lishi kerak").optional(),
    shiftLabel: z.string().max(20).optional(),
    fromTs: z.string().datetime().optional(),
    toTs: z.string().datetime().optional(),
  })
  .refine((d) => (d.fromTs == null) === (d.toTs == null), {
    message: 'fromTs va toTs birga beriladi',
  });

@ApiTags('PP Plan Snapshots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/plan-snapshots')
export class PpPlanSnapshotsController {
  constructor(private readonly svc: PpPlanSnapshotsService) {}

  @ApiOperation({ summary: 'Director PP plan% status from the latest shift/daily snapshot (offline-safe)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('director-status')
  @Roles(...PP_SNAPSHOT_READ)
  async directorStatus(@Query('period') period?: string) {
    const p = PeriodSchema.parse(period ?? 'daily');
    return unwrapOrThrow(await this.svc.getDirectorStatus(p));
  }

  @ApiOperation({ summary: 'Freeze a shift/daily PP plan% snapshot (shift-close trigger)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('capture')
  @Roles(...PP_SNAPSHOT_WRITE)
  async capture(@Body() body: unknown) {
    const dto = CaptureSchema.parse(body);
    return unwrapOrThrow(
      await this.svc.captureSnapshot({
        periodType: dto.periodType,
        snapshotDate: dto.date,
        shiftLabel: dto.shiftLabel ?? null,
        fromTs: dto.fromTs,
        toTs: dto.toTs,
        source: 'shift_close',
      }),
    );
  }
}
