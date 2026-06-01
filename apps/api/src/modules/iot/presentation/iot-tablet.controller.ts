/**
 * @module iot-tablet.controller
 * @description NestJS controller for IoT tablet/PWA + production-session passthrough endpoints.
 *   Wave 11 P1 (2026-05-18): five endpoints are now implemented against IotTabletService —
 *   login, sos-alert, equipment, orders, worker-schedule. The rest are P3-26 stubs that
 *   return HTTP 501 until the real services are wired (tablet PWA shows a "coming soon"
 *   empty state in the meantime).
 *
 *   Zod schemas + role constants live in `iot-tablet.schemas.ts` to keep this
 *   file under the 300-line cap (Rule 16).
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { TabletTokenGuard } from '@common/guards/tablet-token.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { IotTabletService } from '../application/iot-tablet.service';
import { notImplemented } from '@common/exceptions/not-implemented';
import {
  IotPassthroughSchema,
  TabletLoginSchema,
  TabletSessionSchema,
  ProductionSessionSchema,
  TabletSosAlertSchema,
  TabletEquipmentQuerySchema,
  TabletOrdersQuerySchema,
  WorkerScheduleQuerySchema,
  IOT_READ,
  coerceWorkerId,
} from './iot-tablet.schemas';

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Iot Tablet')
@ApiBearerAuth()
@Controller('iot')
export class IotTabletController {
  constructor(private readonly tabletSvc: IotTabletService) {}

  // -- Tablet PWA endpoints ----------------------------------------------------
  // Wave 11 P1: orders, equipment, worker-schedule, login, sos-alert are LIVE.
  // The rest (sessions, shift, handover) remain P3-26 stubs.

  @ApiOperation({ summary: 'Get tablet orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/orders')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletOrders(@Query() raw: Record<string, unknown>) {
    const q = TabletOrdersQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getTabletOrders(q.workerId, q.equipmentId, q.status),
    );
  }

  @ApiOperation({ summary: 'Get tablet worker schedule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/worker-schedule')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletWorkerSchedule(@Query() raw: Record<string, unknown>) {
    const q = WorkerScheduleQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getWorkerSchedule(q.workerId, q.from, q.to),
    );
  }

  @ApiOperation({ summary: 'Get tablet equipment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/equipment')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletEquipment(@Query() raw: Record<string, unknown>) {
    const q = TabletEquipmentQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getTabletEquipment(q.workerId, q.shopFloor),
    );
  }

  @ApiOperation({ summary: 'Get tablet shift' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/shift') @Roles(...IOT_READ)
  async getTabletShift() { return notImplemented('GET /iot/tablet/shift'); }

  @ApiOperation({ summary: 'Get tablet sessions' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/sessions') @Roles(...IOT_READ)
  async getTabletSessions() { return notImplemented('GET /iot/tablet/sessions'); }

  @ApiOperation({ summary: 'Create tablet session' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('tablet/sessions') @Roles(...IOT_READ)
  async createTabletSession(@Body() body: unknown) {
    TabletSessionSchema.parse(body);
    return notImplemented('POST /iot/tablet/sessions');
  }

  @ApiOperation({ summary: 'Tablet login' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('tablet/login')
  @Public()
  async tabletLogin(@Body() body: unknown) {
    const dto = TabletLoginSchema.parse(body);
    return unwrapOrThrow(
      await this.tabletSvc.login(dto.tabelNumber, dto.password),
    );
  }

  @ApiOperation({ summary: 'Tablet sos alert (safety-critical)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('tablet/sos-alert')
  @Public()
  async tabletSosAlert(@Body() body: unknown) {
    const dto = TabletSosAlertSchema.parse(body ?? {});
    // workerId=0 means "anonymous panic press"; we still log + insert so the
    // safety button cannot fail closed. The downstream listener uses the
    // event payload, which carries the alert id even when worker is unknown.
    return unwrapOrThrow(
      await this.tabletSvc.raiseSosAlert({
        workerId: coerceWorkerId(dto.workerId),
        workerName: dto.workerName,
        sessionId: dto.sessionId === undefined || dto.sessionId === null ? null : String(dto.sessionId),
        equipmentId: dto.equipmentId ?? null,
        alertType: dto.alertType,
        message: dto.message,
      }),
    );
  }

  @ApiOperation({ summary: 'Tablet handover' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('tablet/handover') @Roles(...IOT_READ)
  async tabletHandover(@Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/tablet/handover');
  }

  // -- Material kit scan endpoints ---------------------------------------------
  @ApiOperation({ summary: 'Scan material kit item' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('material-kit-items/:id/scan') @Roles(...IOT_READ)
  async scanMaterialKitItem(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/material-kit-items/:id/scan');
  }

  @ApiOperation({ summary: 'Patch scan material kit item' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Patch('material-kit-items/:id/scan') @Roles(...IOT_READ)
  async patchScanMaterialKitItem(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /iot/material-kit-items/:id/scan');
  }

  // -- Production-sessions endpoints -------------------------------------------
  // Note: list (GET) is already served by general-legacy-b.controller.ts at
  //       @Get('iot/production-sessions'). Fastify rejects duplicate GET
  //       declarations, so we keep only POST/Sub-routes here.
  @ApiOperation({ summary: 'Create production session' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions') @Roles(...IOT_READ)
  async createProductionSession(@Body() body: unknown) {
    ProductionSessionSchema.parse(body);
    return notImplemented('POST /iot/production-sessions');
  }

  @ApiOperation({ summary: 'Get production session crew' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('production-sessions/:id/crew') @Roles(...IOT_READ)
  async getProductionSessionCrew(@Param('id') _id: string) {
    return notImplemented('GET /iot/production-sessions/:id/crew');
  }
  @ApiOperation({ summary: 'Start production session' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/start') @Roles(...IOT_READ)
  async startProductionSession(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/start');
  }
  @ApiOperation({ summary: 'Stop production session' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/stop') @Roles(...IOT_READ)
  async stopProductionSession(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/stop');
  }
  @ApiOperation({ summary: 'Report production defect' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/defect') @Roles(...IOT_READ)
  async reportProductionDefect(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/defect');
  }
  @ApiOperation({ summary: 'Submit production evaluation' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/evaluation') @Roles(...IOT_READ)
  async submitProductionEvaluation(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/evaluation');
  }
  @ApiOperation({ summary: 'Submit material return' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/material-return') @Roles(...IOT_READ)
  async submitMaterialReturn(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/material-return');
  }
  @ApiOperation({ summary: 'Submit inline qc' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/inline-qc') @Roles(...IOT_READ)
  async submitInlineQc(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/inline-qc');
  }
}
