/**
 * @module mes-shifts-stats.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { Body, Controller, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';


import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { MesShiftsStatsService } from '../application/mes-shifts-stats.service';
import {
  MesShiftHandoverSchema, MesShiftHandoverDto,
  MesCloseShiftEvaluationSchema, MesCloseShiftEvaluationDto,
  MesUpdateSessionQuantitySchema, MesUpdateSessionQuantityDto,
  MesMaterialConsumptionSchema, MesMaterialConsumptionDto,
} from '../dto/mes.dto';

const MES_WRITE_ROLES  = ['production_manager', 'shift_supervisor', 'mro_manager', 'super_admin', 'director'];
const MES_FLOOR_ROLES  = ['operator', 'worker', 'shift_supervisor', 'production_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('mes')
export class MesShiftsStatsController {
  private readonly logger = new Logger(MesShiftsStatsController.name);

  constructor(private readonly svc: MesShiftsStatsService) {}

  @Get('shifts/current')
  async getCurrentShift() {
    return unwrapOrThrow(await this.svc.getCurrentShift());
  }

  @Post('shifts/handover')
  @UsePipes(new ZodValidationPipe(MesShiftHandoverSchema))
  @Roles(...MES_WRITE_ROLES)
  async shiftHandover(@Body() body: MesShiftHandoverDto) {
    const _rR = await this.svc.shiftHandover(body.outgoing_supervisor, body.incoming_supervisor, body.notes ?? null, body.issues ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @Post('shifts/close-evaluation')
  @UsePipes(new ZodValidationPipe(MesCloseShiftEvaluationSchema))
  @Roles(...MES_WRITE_ROLES)
  async closeShiftEvaluation(@Body() body: MesCloseShiftEvaluationDto) {
    const _rR = await this.svc.closeShiftEvaluation(body.shift_id, body.supervisor_id ?? null, body.production_score ?? 0, body.quality_score ?? 0, body.safety_score ?? 0, body.notes ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @Get('shifts/evaluations')
  @UseGuards(RolesGuard)
  @Roles('shift_supervisor', 'production_manager', 'super_admin', 'director')
  async getShiftEvaluations(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getShiftEvaluations(from, to, safeInt(limit, 50)));
  }

  @Get('oee')
  async getOee() {
    return unwrapOrThrow(await this.svc.getOee());
  }

  @Get('stats')
  async getStats(@Query('date') date?: string) {
    return unwrapOrThrow(await this.svc.getStats(date));
  }

  @Get('gamification/leaderboard')
  async getGamificationLeaderboard(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getGamificationLeaderboard(period ?? 'month'));
  }

  @Get('papka-orders')
  async getPapkaOrders(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getPapkaOrders(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Patch('sessions/:id/pause')
  @UseGuards(RolesGuard)
  @Roles(...MES_FLOOR_ROLES)
  async pauseSession(@Param('id') id: string, @Body() body: { reason?: string }) {
    const _rR = await this.svc.pauseSession(safeInt(id, 0), body.reason);
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Session not found or not active');
    return r[0];
  }

  @Patch('sessions/:id/resume')
  @UseGuards(RolesGuard)
  @Roles(...MES_FLOOR_ROLES)
  async resumeSession(@Param('id') id: string) {
    const _rR = await this.svc.resumeSession(safeInt(id, 0));
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Session not found or not paused');
    return r[0];
  }

  @Patch('sessions/:id/quantity')
  @UsePipes(new ZodValidationPipe(MesUpdateSessionQuantitySchema))
  @Roles(...MES_FLOOR_ROLES)
  async updateSessionQuantity(@Param('id') id: string, @Body() body: MesUpdateSessionQuantityDto) {
    const _rR = await this.svc.updateSessionQuantity(safeInt(id, 0), body.produced_qty, body.rejected_qty);
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Session not found');
    return r[0];
  }

  @Post('material-consumption')
  @UsePipes(new ZodValidationPipe(MesMaterialConsumptionSchema))
  @Roles(...MES_FLOOR_ROLES)
  async recordMaterialConsumption(@Body() body: MesMaterialConsumptionDto) {
    const _rR = await this.svc.recordMaterialConsumption(body.session_id, body.material_id, body.quantity, body.batch_number ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @Get('orders')
  async getOrders() { return []; }

  @Get('orders/:id')
  async getOrderById(@Param('id') _id: string) { return null; }

  @Get('shifts')
  async getShifts() { return []; }

  @Get('maintenance')
  async getMaintenance() { return []; }
}
