/**
 * @module iot-main.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IotMainService } from '../application/iot-main.service';
import { IotSensorsExtendedService } from '../application/iot-sensors-extended.service';

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
  pin: z.string().max(50).optional(),
}).passthrough();

const TabletSessionSchema = z.object({
  workerId: z.union([z.string(), z.number()]).optional(),
  startedAt: z.string().optional(),
}).passthrough();

const CreateAlertSchema = z.object({
  type: z.string().max(100).optional(),
  severity: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(200).optional(),
}).passthrough();

const PatchDeviceSchema = z.object({
  name: z.string().max(200).optional(),
  location: z.string().max(500).optional(),
  status: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

const ProductionSessionSchema = z.object({
  orderId: z.union([z.string(), z.number()]).optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
  shiftId: z.union([z.string(), z.number()]).optional(),
}).passthrough();
import {
  CameraAlertsQuerySchema,
  DeptLimitQuerySchema,
  DeviceIdQuerySchema,
  EmployeeHealthQuerySchema,
  MachineLogsQuerySchema,
  OeeQuerySchema,
  QualityDefectsCameraQuerySchema,
  ShiftReportQuerySchema,
  StatusLimitQuerySchema,
} from './dto/iot-camera.dto';

const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Iot Main')
@ApiBearerAuth()
@Controller('iot')
export class IotMainController {
  constructor(
    private readonly svc: IotMainService,
    private readonly sensorsSvc: IotSensorsExtendedService,
  ) {}

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard') @Roles(...IOT_READ)
  async getDashboard() { return unwrapOrThrow(await this.svc.getDashboard()); }

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts') @Roles(...IOT_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getAlerts(q.status, q.severity, q.limit));
  }

  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('alerts/:id/acknowledge') @Roles(...IOT_WRITE) @UseInterceptors(AuditInterceptor)
  async acknowledgeAlert(@Param('id') id: string) { return unwrapOrThrow(await this.svc.acknowledgeAlert(id)); }

  @ApiOperation({ summary: 'Get attendance live' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('attendance/live') @Roles(...IOT_READ)
  async getAttendanceLive() { return unwrapOrThrow(await this.svc.getAttendanceLive()); }

  @ApiOperation({ summary: 'Get room inspections' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('room-inspections') @Roles(...IOT_READ)
  async getRoomInspections(@Query() raw: Record<string, unknown>) {
    const q = StatusLimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getRoomInspections(q.status, q.limit));
  }

  @ApiOperation({ summary: 'Get employee health' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-health') @Roles(...IOT_READ)
  async getEmployeeHealth(@Query() raw: Record<string, unknown>) {
    const q = EmployeeHealthQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeHealth(q.employee_id, q.limit));
  }

  @ApiOperation({ summary: 'Get machine status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('machine-status') @Roles(...IOT_READ)
  async getMachineStatus() { return unwrapOrThrow(await this.svc.getMachineStatusCurrent()); }

  @ApiOperation({ summary: 'Get machine status logs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('machine-status-logs')
  @Roles(...IOT_READ)
  async getMachineStatusLogs(@Query() raw: Record<string, unknown>) {
    const q = MachineLogsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getMachineStatusLogs(q.device_id, q.limit));
  }

  @ApiOperation({ summary: 'Get safety violations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety-violations')
  @Roles(...IOT_READ)
  async getSafetyViolations(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyViolations(q.status, q.severity, q.limit));
  }

  @ApiOperation({ summary: 'Get employee productivity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-productivity')
  @Roles(...IOT_READ)
  async getEmployeeProductivity(@Query() raw: Record<string, unknown>) {
    const q = DeptLimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeProductivity(q.department_id, q.limit));
  }

  @ApiOperation({ summary: 'Get environment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('environment')
  @Roles(...IOT_READ)
  async getEnvironment(
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('device_id') deviceId?: string,
  ) {
    return unwrapOrThrow(await this.svc.getEnvironmentData(type, location, deviceId));
  }

  @ApiOperation({ summary: 'Get device stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('devices/:id/stats')
  @Roles(...IOT_READ)
  async getDeviceStats(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getDeviceStats(id));
  }

  @ApiOperation({ summary: 'Get quality defects' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quality-defects')
  @Roles(...IOT_READ)
  async getQualityDefects(@Query() raw: Record<string, unknown>) {
    const q = QualityDefectsCameraQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getQualityDefects(q.status, q.camera_id, q.limit));
  }

  @ApiOperation({ summary: 'Get recognition stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('recognition-stats')
  @Roles(...IOT_READ)
  async getRecognitionStats() {
    return unwrapOrThrow(await this.svc.getRecognitionStats());
  }

  @ApiOperation({ summary: 'Get energy consumption' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('energy-consumption')
  @Roles(...IOT_READ)
  async getEnergyConsumption(@Query() raw: Record<string, unknown>) {
    const q = DeviceIdQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEnvironmentData('energy', undefined, q.device_id));
  }

  @ApiOperation({ summary: 'Get temperature' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('temperature')
  @Roles(...IOT_READ)
  async getTemperature(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('temperature', location));
  }

  @ApiOperation({ summary: 'Get humidity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('humidity')
  @Roles(...IOT_READ)
  async getHumidity(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('humidity', location));
  }

  @ApiOperation({ summary: 'Get pressure' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pressure')
  @Roles(...IOT_READ)
  async getPressure(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('pressure', location));
  }

  @ApiOperation({ summary: 'Get vibration' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vibration')
  @Roles(...IOT_READ)
  async getVibration(
    @Query('location') location?: string,
    @Query('device_id') deviceId?: string,
  ) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('vibration', location, deviceId));
  }

  @ApiOperation({ summary: 'Get gas levels' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gas-levels')
  @Roles(...IOT_READ)
  async getGasLevels(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('gas', location));
  }

  @ApiOperation({ summary: 'Get noise levels' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('noise-levels')
  @Roles(...IOT_READ)
  async getNoiseLevels(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('noise', location));
  }

  @ApiOperation({ summary: 'Get production metrics' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('production-metrics')
  @Roles(...IOT_READ)
  async getProductionMetrics(@Query('shift') shift?: string) {
    return unwrapOrThrow(await this.svc.getProductionMetrics(shift));
  }

  @ApiOperation({ summary: 'Get oee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee')
  @Roles(...IOT_READ)
  async getOee(@Query() raw: Record<string, unknown>) {
    const q = OeeQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getOee(q.device_id, q.period));
  }

  @ApiOperation({ summary: 'Get downtime' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('downtime')
  @Roles(...IOT_READ)
  async getDowntime(@Query() raw: Record<string, unknown>) {
    const q = DeviceIdQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getMachineStatusLogs(q.device_id, 100));
  }

  @ApiOperation({ summary: 'Get shift report' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shift-report')
  @Roles(...IOT_READ)
  async getShiftReport(@Query() raw: Record<string, unknown>) {
    const q = ShiftReportQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getShiftReport(q.shift, q.date));
  }

  @ApiOperation({ summary: 'Get maintenance schedule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('maintenance-schedule')
  @Roles(...IOT_READ)
  async getMaintenanceSchedule() {
    return unwrapOrThrow(await this.svc.getMachineStatusCurrent());
  }

  @ApiOperation({ summary: 'Get sensors list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('sensors') @Roles(...IOT_READ)
  async getSensorsList(@Query('type') type?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.sensorsSvc.listSensors(type, status, Number(page ?? 1), Number(limit ?? 50)));
  }

  @ApiOperation({ summary: 'Get telemetry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('telemetry') @Roles(...IOT_READ)
  async getTelemetry() {
    return unwrapOrThrow(await this.sensorsSvc.getDashboard());
  }

  @ApiOperation({ summary: 'Get live dashboard summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('live-dashboard/summary') @Roles(...IOT_READ)
  async getLiveDashboardSummary() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @ApiOperation({ summary: 'Get downtime reason codes' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('downtime-reason-codes') @Roles(...IOT_READ)
  async getDowntimeReasonCodes() { return notImplemented('GET /iot/downtime-reason-codes'); }
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

  @ApiOperation({ summary: 'Create alert' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('alerts') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async createAlert(@Body() body: unknown) {
    CreateAlertSchema.parse(body);
    return notImplemented('POST /iot/alerts');
  }

  @ApiOperation({ summary: 'Patch acknowledge alert' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('alerts/:id/acknowledge') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchAcknowledgeAlert(@Param('id') id: string) { return unwrapOrThrow(await this.svc.acknowledgeAlert(id)); }

  @ApiOperation({ summary: 'Patch device' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Patch('devices/:id') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchDevice(@Param('id') _id: string, @Body() body: unknown) {
    PatchDeviceSchema.parse(body);
    return notImplemented('PATCH /iot/devices/:id');
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

  // ── Production-sessions root POST — list (GET) is already served by
  //    general-legacy-b.controller.ts at @Get('iot/production-sessions')
  //    via the empty @Controller() prefix. Fastify rejects duplicate GET
  //    declarations, so we keep only the POST here (no caller-side conflict).
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

  // OEE live snapshot — real values come from sensor_readings + production_sessions
  // aggregation; for now we serve a typed empty snapshot so the page renders.
  @ApiOperation({ summary: 'Get oee live' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee/live') @Roles(...IOT_READ)
  async getOeeLive(@Query('device_id') _deviceId?: string) {
    return { availability: 0, performance: 0, quality: 0, oee: 0, sample_size: 0, generated_at: new Date().toISOString(), by_machine: [] };
  }
}
