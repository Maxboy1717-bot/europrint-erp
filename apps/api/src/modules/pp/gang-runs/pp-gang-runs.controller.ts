/**
 * @module pp-gang-runs.controller
 * @description REST surface for gang-run per-order acceptance + lot-split brak (vision 07-pp#37).
 *   A gang run groups several production orders printed on one physical sheet; accepting it
 *   splits the run's total brak proportionally by each order's quantity and stamps each order
 *   with its own acceptance-act reference.
 *
 *   GET  /api/pp/gang-runs            — list gang runs (newest first)
 *   GET  /api/pp/gang-runs/:id        — one gang run with its members (per-order brak + act)
 *   POST /api/pp/gang-runs            — create a run over >= 2 production orders
 *   POST /api/pp/gang-runs/:id/accept — split brak per-order + generate per-order acceptance acts
 *
 *   Auth mirrors the sibling pp reason-codes surface: reads open to the PP read tier, writes
 *   (create/accept) gated to the master-data write tier. Transport-only (Rule 6): validate
 *   with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { PpGangRunsService } from './pp-gang-runs.service';

// Read tier = pp reason-codes read set: any planner/production role may view gang runs.
const PP_GANG_READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
// Write tier = pp reason-codes write set: only super_admin / director / production_manager
// may group orders and post an acceptance (the brak-split is an operational decision).
const PP_GANG_WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER];

const CreateGangRunSchema = z.object({
  printJobRef: z.string().min(1).max(80),
  orderIds: z.array(z.number().int().positive()).min(2, 'Kamida 2 ta buyurtma kerak'),
});

const AcceptGangRunSchema = z.object({
  totalBrakQty: z.number().nonnegative(),
});

@ApiTags('PP Gang Runs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/gang-runs')
export class PpGangRunsController {
  constructor(private readonly svc: PpGangRunsService) {}

  @ApiOperation({ summary: 'List gang runs (newest first)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...PP_GANG_READ)
  async list() {
    const items = unwrapOrThrow(await this.svc.listGangRuns());
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get one gang run with its member orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(...PP_GANG_READ)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getGangRun(id));
  }

  @ApiOperation({ summary: 'Create a gang run over >= 2 production orders' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request (< 2 orders or an order is missing)' })
  @Post()
  @Roles(...PP_GANG_WRITE)
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateGangRunSchema.parse(body);
    return unwrapOrThrow(
      await this.svc.createGangRun({
        printJobRef: dto.printJobRef,
        orderIds: dto.orderIds,
        createdBy: user?.id ?? null,
      }),
    );
  }

  @ApiOperation({ summary: 'Accept a gang run: split brak per-order + generate acceptance acts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Already accepted / no members' })
  @Post(':id/accept')
  @Roles(...PP_GANG_WRITE)
  async accept(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = AcceptGangRunSchema.parse(body);
    return unwrapOrThrow(await this.svc.acceptGangRun(id, dto.totalBrakQty));
  }
}
