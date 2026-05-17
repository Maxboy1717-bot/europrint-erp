/**
 * @module iot-tablet.controller
 * @description NestJS controller for IoT tablet/PWA + production-session passthrough endpoints.
 *              These are P3-26 stubs that return HTTP 501 until the real services are wired
 *              (the frontend tablet PWA displays a "coming soon" empty state in the meantime).
 *              Extracted from iot-main.controller as part of Rule 13/16 split.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

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

const TabletLoginSchema = z.object({
  username: z.string().max(200).optional(),
  password: z.string().max(500).optional(),
  pin:      z.string().max(50).optional(),
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

const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Iot Tablet')
@ApiBearerAuth()
@Controller('iot')
export class IotTabletController {
  // ── Tablet PWA endpoints (P3-26 stubs) ─────────────────────────────────────
  @ApiOperation({ summary: 'Get tablet orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/orders') @Roles(...IOT_READ)
  async getTabletOrders() { return notImplemented('GET /iot/tablet/orders'); }
  @ApiOperation({ summary: 'Get tablet worker schedule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/worker-schedule') @Roles(...IOT_READ)
  async getTabletWorkerSchedule() { return notImplemented('GET /iot/tablet/worker-schedule'); }
  @ApiOperation({ summary: 'Get tablet equipment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('tablet/equipment') @Roles(...IOT_READ)
  async getTabletEquipment() { return notImplemented('GET /iot/tablet/equipment'); }
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
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('tablet/login') @Roles(...IOT_READ)
  async tabletLogin(@Body() body: unknown) {
    TabletLoginSchema.parse(body);
    return notImplemented('POST /iot/tablet/login');
  }
  @ApiOperation({ summary: 'Tablet sos alert' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('tablet/sos-alert') @Roles(...IOT_READ)
  async tabletSosAlert(@Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    return notImplemented('POST /iot/tablet/sos-alert');
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
