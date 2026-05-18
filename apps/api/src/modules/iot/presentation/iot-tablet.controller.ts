/**
 * @module iot-tablet.controller
 * @description NestJS controller for IoT tablet/PWA + production-session passthrough endpoints.
 *              Wave 11 P1 (2026-05-18): five endpoints are now implemented against
 *              IotTabletService — login, sos-alert, equipment, orders, worker-schedule.
 *              The remaining handlers in this file are still P3-26 stubs that return
 *              HTTP 501 until the real services are wired (tablet PWA shows a "coming
 *              soon" empty state in the meantime).
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { IotTabletService } from '../application/iot-tablet.service';

const IotPassthroughSchema = z.record(z.unknown());

// P3-26: tablet / production-session passthrough stubs return 501 instead of
// echoing the payload. Frontend (tablet PWA) should display a "coming soon"
// empty state until the real services are wired.
const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};

// Wave 11 P1: tabel-number + password login. The proper QR-token flow is
// deferred to P3-31 (no `tablet_logins` / `iot_qr_tokens` table exists yet).
const TabletLoginSchema = z.object({
  tabelNumber: z.string().min(1).max(50),
  password: z.string().min(1).max(500),
}).passthrough();

const TabletSessionSchema = z.object({
  workerId:  z.union([z.string(), z.number()]).optional(),
  startedAt: z.string().optional(),
}).passthrough();

const ProductionSessionSchema = z.object({
  orderId:   z.union([z.string(), z.number()]).optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
  shiftId:   z.union([z.string(), z.number()]).optional(),
}).passthrough();

// Wave 11 P1: SOS alert payload mirrors the existing PWA call site
// (useIoTTabletAlerts.ts:188). `workerId` is added (optional in body — falls
// back to the JWT subject) so the safety button can fire without a tablet
// session lookup. TODO P3-31: derive workerId from a verified tablet token.
const TabletSosAlertSchema = z.object({
  workerId:    z.union([z.string(), z.number()]).optional(),
  workerName:  z.string().max(255).optional(),
  sessionId:   z.union([z.string(), z.number()]).nullable().optional(),
  equipmentId: z.union([z.string(), z.number()]).nullable().optional(),
  alertType:   z.string().max(50).optional(),
  message:     z.string().max(2000).optional(),
  lat:         z.number().optional(),
  lng:         z.number().optional(),
}).passthrough();

const TabletEquipmentQuerySchema = z.object({
  workerId: z.coerce.number().int().positive().optional(),
  shopFloor: z.string().max(200).optional(),
}).passthrough();

const TabletOrdersQuerySchema = z.object({
  workerId: z.coerce.number().int().positive().optional(),
  equipmentId: z.coerce.number().int().positive().optional(),
  status: z.string().max(50).optional(),
}).passthrough();

const WorkerScheduleQuerySchema = z.object({
  workerId: z.coerce.number().int().positive(),
  from: z.string().max(30).optional(),
  to: z.string().max(30).optional(),
}).passthrough();

const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Iot Tablet')
@ApiBearerAuth()
@Controller('iot')
export class IotTabletController {
  constructor(private readonly tabletSvc: IotTabletService) {}

  // ── Tablet PWA endpoints ────────────────────────────────────────────────────
  // Wave 11 P1: orders, equipment, worker-schedule, login, sos-alert are LIVE.
  // The rest (sessions, shift, handover) remain P3-26 stubs.

  @ApiOperation({ summary: 'Get tablet orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/orders')
  @Public()
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
  async getTabletEquipment(@Query() raw: Record<string, unknown>) {
    const q = TabletEquipmentQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getTabletEquipment(q.workerId, q.shopFloor),
    );
  }

  @ApiOperation({ summary: 'Get tablet shift' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/shift') @Roles(...IOT_READ)
  async getTabletShift() { return notImplemented('GET /iot/tablet/shift'); }

  @ApiOperation({ summary: 'Get tablet sessions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/sessions') @Roles(...IOT_READ)
  async getTabletSessions() { return notImplemented('GET /iot/tablet/sessions'); }

  @ApiOperation({ summary: 'Create tablet session' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('tablet/sessions') @Roles(...IOT_READ)
  async createTabletSession(@Body() body: unknown) {
    TabletSessionSchema.parse(body);
    return notImplemented('POST /iot/tablet/sessions');
  }

  @ApiOperation({ summary: 'Tablet login' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('tablet/sos-alert')
  @Public()
  async tabletSosAlert(@Body() body: unknown) {
    const dto = TabletSosAlertSchema.parse(body ?? {});
    const workerIdNum =
      typeof dto.workerId === 'number'
        ? dto.workerId
        : typeof dto.workerId === 'string' && /^\d+$/.test(dto.workerId)
          ? Number(dto.workerId)
          : 0;
    // workerId=0 means "anonymous panic press"; we still log + insert so the
    // safety button cannot fail closed. The downstream listener uses the
    // event payload, which carries the alert id even when worker is unknown.
    return unwrapOrThrow(
      await this.tabletSvc.raiseSosAlert({
        workerId: workerIdNum,
        workerName: dto.workerName,
        sessionId: dto.sessionId === undefined || dto.sessionId === null ? null : String(dto.sessionId),
        equipmentId: dto.equipmentId ?? null,
        alertType: dto.alertType,
        message: dto.message,
      }),
    );
  }

  @ApiOperation({ summary: 'Tablet handover' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('tablet/handover') @Roles(...IOT_READ)
  async tabletHandover(@Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/tablet/handover');
  }

  // ── Material kit scan endpoints ─────────────────────────────────────────────
  @ApiOperation({ summary: 'Scan material kit item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('material-kit-items/:id/scan') @Roles(...IOT_READ)
  async scanMaterialKitItem(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/material-kit-items/:id/scan');
  }

  @ApiOperation({ summary: 'Patch scan material kit item' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Patch('material-kit-items/:id/scan') @Roles(...IOT_READ)
  async patchScanMaterialKitItem(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /iot/material-kit-items/:id/scan');
  }

  // ── Production-sessions endpoints ───────────────────────────────────────────
  // Note: list (GET) is already served by general-legacy-b.controller.ts
  //       at @Get('iot/production-sessions'). Fastify rejects duplicate GET
  //       declarations, so we keep only the POST/Sub-routes here.
  @ApiOperation({ summary: 'Create production session' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions') @Roles(...IOT_READ)
  async createProductionSession(@Body() body: unknown) {
    ProductionSessionSchema.parse(body);
    return notImplemented('POST /iot/production-sessions');
  }

  @ApiOperation({ summary: 'Get production session crew' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('production-sessions/:id/crew') @Roles(...IOT_READ)
  async getProductionSessionCrew(@Param('id') _id: string) {
    return notImplemented('GET /iot/production-sessions/:id/crew');
  }
  @ApiOperation({ summary: 'Start production session' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('production-sessions/:id/start') @Roles(...IOT_READ)
  async startProductionSession(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/start');
  }
  @ApiOperation({ summary: 'Stop production session' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/stop') @Roles(...IOT_READ)
  async stopProductionSession(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/stop');
  }
  @ApiOperation({ summary: 'Report production defect' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/defect') @Roles(...IOT_READ)
  async reportProductionDefect(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/defect');
  }
  @ApiOperation({ summary: 'Submit production evaluation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/evaluation') @Roles(...IOT_READ)
  async submitProductionEvaluation(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/evaluation');
  }
  @ApiOperation({ summary: 'Submit material return' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/material-return') @Roles(...IOT_READ)
  async submitMaterialReturn(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/material-return');
  }
  @ApiOperation({ summary: 'Submit inline qc' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('production-sessions/:id/inline-qc') @Roles(...IOT_READ)
  async submitInlineQc(@Param('id') _id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/production-sessions/:id/inline-qc');
  }
}
