/**
 * @module mes-shifts-stats.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { Body, Controller, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';


import { assertFound } from '@common/assertions';
import { I18nService } from 'nestjs-i18n';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, unwrapOrNotFoundDefined, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { MesShiftsStatsService } from '../application/mes-shifts-stats.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import {
  MesShiftHandoverSchema, MesShiftHandoverDto,
  MesConfirmShiftHandoverSchema, MesConfirmShiftHandoverDto,
  MesCloseShiftEvaluationSchema, MesCloseShiftEvaluationDto,
  MesUpdateSessionQuantitySchema, MesUpdateSessionQuantityDto,
  MesMaterialConsumptionSchema, MesMaterialConsumptionDto,
} from '../dto/mes.dto';

const MES_WRITE_ROLES  = ['production_manager', 'shift_supervisor', 'mro_manager', 'super_admin', 'director'];
const MES_FLOOR_ROLES  = ['operator', 'worker', 'shift_supervisor', 'production_manager', 'super_admin', 'director'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mes Shifts Stats')
@Controller('mes')
export class MesShiftsStatsController {
  private readonly logger = new Logger(MesShiftsStatsController.name);

  constructor(private readonly svc: MesShiftsStatsService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'Get current shift' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shifts/current')
  async getCurrentShift(@CurrentUser() user: AuthenticatedUser) {
    const scope = await this.svc.resolveVisibilityScope(user);
    return unwrapOrThrow(await this.svc.getCurrentShift(scope));
  }

  @ApiOperation({ summary: 'Shift handover' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('shifts/handover')
  @UsePipes(new ZodValidationPipe(MesShiftHandoverSchema))
  @Roles(...MES_WRITE_ROLES)
  async shiftHandover(@Body() body: MesShiftHandoverDto) {
    const _rR = await this.svc.shiftHandover(body.outgoing_supervisor, body.incoming_supervisor, body.notes ?? null, body.issues ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @ApiOperation({ summary: 'Confirm shift handover (receiving supervisor signature gate, SB0429)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found, already confirmed, or not the receiving supervisor' })
  @Patch('shifts/handover/:id/confirm')
  @UsePipes(new ZodValidationPipe(MesConfirmShiftHandoverSchema))
  @Roles(...MES_WRITE_ROLES)
  async confirmShiftHandover(@Param('id') id: string, @Body() body: MesConfirmShiftHandoverDto, @CurrentUser() user: AuthenticatedUser) {
    const _rR = await this.svc.confirmShiftHandover(safeInt(id, 0), user?.id ?? 0, body.signature_data);
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.shiftHandoverNotFoundOrNotReceiverWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Close shift evaluation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('shifts/close-evaluation')
  @UsePipes(new ZodValidationPipe(MesCloseShiftEvaluationSchema))
  @Roles(...MES_WRITE_ROLES)
  async closeShiftEvaluation(@Body() body: MesCloseShiftEvaluationDto) {
    const _rR = await this.svc.closeShiftEvaluation(body.shift_id, body.supervisor_id ?? null, body.production_score ?? 0, body.quality_score ?? 0, body.safety_score ?? 0, body.notes ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @ApiOperation({ summary: 'Get shift evaluations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shifts/evaluations')
  @UseGuards(RolesGuard)
  @Roles('shift_supervisor', 'production_manager', 'super_admin', 'director')
  async getShiftEvaluations(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getShiftEvaluations(from, to, safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Get oee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee')
  async getOee(@CurrentUser() user: AuthenticatedUser) {
    const scope = await this.svc.resolveVisibilityScope(user);
    return unwrapOrThrow(await this.svc.getOee(scope));
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats(@Query('date') date?: string) {
    return unwrapOrThrow(await this.svc.getStats(date));
  }

  @ApiOperation({ summary: 'Get gamification leaderboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gamification/leaderboard')
  async getGamificationLeaderboard(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getGamificationLeaderboard(period ?? 'month'));
  }

  @ApiOperation({ summary: 'Get papka orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('papka-orders')
  async getPapkaOrders(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getPapkaOrders(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Pause session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('sessions/:id/pause')
  @UseGuards(RolesGuard)
  @Roles(...MES_FLOOR_ROLES)
  async pauseSession(@Param('id') id: string, @Body() body: { reason?: string }) {
    const _rR = await this.svc.pauseSession(safeInt(id, 0), body.reason);
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.sessionNotFoundOrNotActiveWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Resume session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('sessions/:id/resume')
  @UseGuards(RolesGuard)
  @Roles(...MES_FLOOR_ROLES)
  async resumeSession(@Param('id') id: string) {
    const _rR = await this.svc.resumeSession(safeInt(id, 0));
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.sessionNotFoundOrNotPausedWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Update session quantity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('sessions/:id/quantity')
  @UsePipes(new ZodValidationPipe(MesUpdateSessionQuantitySchema))
  @Roles(...MES_FLOOR_ROLES)
  async updateSessionQuantity(@Param('id') id: string, @Body() body: MesUpdateSessionQuantityDto) {
    const _rR = await this.svc.updateSessionQuantity(safeInt(id, 0), body.produced_qty, body.rejected_qty);
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.mesSessionNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Record material consumption' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('material-consumption')
  @UsePipes(new ZodValidationPipe(MesMaterialConsumptionSchema))
  @Roles(...MES_FLOOR_ROLES)
  async recordMaterialConsumption(@Body() body: MesMaterialConsumptionDto) {
    const _rR = await this.svc.recordMaterialConsumption(body.session_id, body.material_id, body.quantity, body.batch_number ?? null, body.unit_of_measure ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @ApiOperation({ summary: 'Get orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('orders')
  async getOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return unwrapOrThrow(await this.svc.getProductionOrders(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return unwrapOrNotFoundDefined(await this.svc.getProductionOrderById(safeInt(id, 0)), `Order ${id} not found`);
  }

  @ApiOperation({ summary: 'Get shifts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shifts')
  async getShifts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.getShifts(from, to, safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Get maintenance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('maintenance')
  async getMaintenance(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const scope = await this.svc.resolveVisibilityScope(user);
    return unwrapOrThrow(await this.svc.getMaintenanceRequests(status, safeInt(limit, 50), safeInt(offset, 0), scope));
  }

  @ApiOperation({ summary: 'Get work center norms (capacity, efficiency, hours)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('work-centers/norms')
  async getWorkCenterNorms(@CurrentUser() user: AuthenticatedUser) {
    const scope = await this.svc.resolveVisibilityScope(user);
    return unwrapOrThrow(await this.svc.getWorkCenterNorms(scope));
  }
}
