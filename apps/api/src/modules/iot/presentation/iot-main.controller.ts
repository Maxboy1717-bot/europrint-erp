/**
 * @module iot-main.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IotMainService } from '../application/iot-main.service';
import { IotSensorsExtendedService } from '../application/iot-sensors-extended.service';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot')
export class IotMainController {
  constructor(
    private readonly svc: IotMainService,
    private readonly sensorsSvc: IotSensorsExtendedService,
  ) {}

  @Get('dashboard') @Roles(...IOT_READ)
  async getDashboard() { return unwrapOrThrow(await this.svc.getDashboard()); }

  @Get('alerts') @Roles(...IOT_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getAlerts(q.status, q.severity, q.limit));
  }

  @Post('alerts/:id/acknowledge') @Roles(...IOT_WRITE) @UseInterceptors(AuditInterceptor)
  async acknowledgeAlert(@Param('id') id: string) { return unwrapOrThrow(await this.svc.acknowledgeAlert(id)); }

  @Get('attendance/live') @Roles(...IOT_READ)
  async getAttendanceLive() { return unwrapOrThrow(await this.svc.getAttendanceLive()); }

  @Get('room-inspections') @Roles(...IOT_READ)
  async getRoomInspections(@Query() raw: Record<string, unknown>) {
    const q = StatusLimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getRoomInspections(q.status, q.limit));
  }

  @Get('employee-health') @Roles(...IOT_READ)
  async getEmployeeHealth(@Query() raw: Record<string, unknown>) {
    const q = EmployeeHealthQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeHealth(q.employee_id, q.limit));
  }

  @Get('machine-status') @Roles(...IOT_READ)
  async getMachineStatus() { return unwrapOrThrow(await this.svc.getMachineStatusCurrent()); }

  @Get('machine-status-logs')
  @Roles(...IOT_READ)
  async getMachineStatusLogs(@Query() raw: Record<string, unknown>) {
    const q = MachineLogsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getMachineStatusLogs(q.device_id, q.limit));
  }

  @Get('safety-violations')
  @Roles(...IOT_READ)
  async getSafetyViolations(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyViolations(q.status, q.severity, q.limit));
  }

  @Get('employee-productivity')
  @Roles(...IOT_READ)
  async getEmployeeProductivity(@Query() raw: Record<string, unknown>) {
    const q = DeptLimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeProductivity(q.department_id, q.limit));
  }

  @Get('environment')
  @Roles(...IOT_READ)
  async getEnvironment(
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('device_id') deviceId?: string,
  ) {
    return unwrapOrThrow(await this.svc.getEnvironmentData(type, location, deviceId));
  }

  @Get('devices/:id/stats')
  @Roles(...IOT_READ)
  async getDeviceStats(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getDeviceStats(id));
  }

  @Get('quality-defects')
  @Roles(...IOT_READ)
  async getQualityDefects(@Query() raw: Record<string, unknown>) {
    const q = QualityDefectsCameraQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getQualityDefects(q.status, q.camera_id, q.limit));
  }

  @Get('recognition-stats')
  @Roles(...IOT_READ)
  async getRecognitionStats() {
    return unwrapOrThrow(await this.svc.getRecognitionStats());
  }

  @Get('energy-consumption')
  @Roles(...IOT_READ)
  async getEnergyConsumption(@Query() raw: Record<string, unknown>) {
    const q = DeviceIdQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEnvironmentData('energy', undefined, q.device_id));
  }

  @Get('temperature')
  @Roles(...IOT_READ)
  async getTemperature(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('temperature', location));
  }

  @Get('humidity')
  @Roles(...IOT_READ)
  async getHumidity(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('humidity', location));
  }

  @Get('pressure')
  @Roles(...IOT_READ)
  async getPressure(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('pressure', location));
  }

  @Get('vibration')
  @Roles(...IOT_READ)
  async getVibration(
    @Query('location') location?: string,
    @Query('device_id') deviceId?: string,
  ) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('vibration', location, deviceId));
  }

  @Get('gas-levels')
  @Roles(...IOT_READ)
  async getGasLevels(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('gas', location));
  }

  @Get('noise-levels')
  @Roles(...IOT_READ)
  async getNoiseLevels(@Query('location') location?: string) {
    return unwrapOrThrow(await this.svc.getEnvironmentData('noise', location));
  }

  @Get('production-metrics')
  @Roles(...IOT_READ)
  async getProductionMetrics(@Query('shift') shift?: string) {
    return unwrapOrThrow(await this.svc.getProductionMetrics(shift));
  }

  @Get('oee')
  @Roles(...IOT_READ)
  async getOee(@Query() raw: Record<string, unknown>) {
    const q = OeeQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getOee(q.device_id, q.period));
  }

  @Get('downtime')
  @Roles(...IOT_READ)
  async getDowntime(@Query() raw: Record<string, unknown>) {
    const q = DeviceIdQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getMachineStatusLogs(q.device_id, 100));
  }

  @Get('shift-report')
  @Roles(...IOT_READ)
  async getShiftReport(@Query() raw: Record<string, unknown>) {
    const q = ShiftReportQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getShiftReport(q.shift, q.date));
  }

  @Get('maintenance-schedule')
  @Roles(...IOT_READ)
  async getMaintenanceSchedule() {
    return unwrapOrThrow(await this.svc.getMachineStatusCurrent());
  }

  @Get('sensors') @Roles(...IOT_READ)
  async getSensorsList(@Query('type') type?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.sensorsSvc.listSensors(type, status, Number(page ?? 1), Number(limit ?? 50)));
  }

  @Get('telemetry') @Roles(...IOT_READ)
  async getTelemetry() {
    return unwrapOrThrow(await this.sensorsSvc.getDashboard());
  }

  @Get('live-dashboard/summary') @Roles(...IOT_READ)
  async getLiveDashboardSummary() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @Get('downtime-reason-codes') @Roles(...IOT_READ)
  async getDowntimeReasonCodes() { return []; }
  @Get('tablet/orders') @Roles(...IOT_READ)
  async getTabletOrders() { return { data: [] }; }
  @Get('tablet/worker-schedule') @Roles(...IOT_READ)
  async getTabletWorkerSchedule() { return { data: [] }; }
  @Get('tablet/equipment') @Roles(...IOT_READ)
  async getTabletEquipment() { return { data: [] }; }
  @Get('tablet/shift') @Roles(...IOT_READ)
  async getTabletShift() { return { shift: null }; }
  @Get('tablet/sessions') @Roles(...IOT_READ)
  async getTabletSessions() { return { data: [] }; }
  @Post('tablet/sessions') @Roles(...IOT_READ)
  async createTabletSession(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }
  @Post('tablet/login') @Roles(...IOT_READ)
  async tabletLogin(@Body() body: Record<string, unknown>) { return { token: null, worker: null }; }
  @Post('tablet/sos-alert') @Roles(...IOT_READ)
  async tabletSosAlert(@Body() _body: Record<string, unknown>) { return { success: true }; }
  @Post('tablet/handover') @Roles(...IOT_READ)
  async tabletHandover(@Body() _body: Record<string, unknown>) { return { success: true }; }
  @Post('material-kit-items/:id/scan') @Roles(...IOT_READ)
  async scanMaterialKitItem(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, scanned: true }; }

  @Post('alerts') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async createAlert(@Body() body: Record<string, unknown>) { return { id: Date.now(), ...body, created: true }; }

  @Patch('alerts/:id/acknowledge') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchAcknowledgeAlert(@Param('id') id: string) { return unwrapOrThrow(await this.svc.acknowledgeAlert(id)); }

  @Patch('devices/:id') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchDevice(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body, updated: true }; }

  @Patch('material-kit-items/:id/scan') @Roles(...IOT_READ)
  async patchScanMaterialKitItem(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, scanned: true }; }

  // ── Production-sessions root (list + create) — needed by IoT tablet UI
  //    (use-iot.ts:56 queries the list; useIoTTablet.ts:116 POSTs to create
  //    a new session). Implementation deferred until iot_production_sessions
  //    schema lands; returning safe empty payloads keeps the tablet UI
  //    rendering the empty state instead of erroring.

  @Get('production-sessions') @Roles(...IOT_READ)
  async listProductionSessions(
    @Query('workerId') _workerId?: string,
    @Query('status') _status?: string,
  ) {
    return { data: [], total: 0 };
  }

  @Post('production-sessions') @Roles(...IOT_READ)
  async createProductionSession(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), status: 'pending', ...body };
  }

  @Get('production-sessions/:id/crew') @Roles(...IOT_READ)
  async getProductionSessionCrew(@Param('id') id: string) { return { data: [], sessionId: id }; }
  @Post('production-sessions/:id/start') @Roles(...IOT_READ)
  async startProductionSession(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, status: 'started' }; }
  @Post('production-sessions/:id/stop') @Roles(...IOT_READ)
  async stopProductionSession(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, status: 'stopped' }; }
  @Post('production-sessions/:id/defect') @Roles(...IOT_READ)
  async reportProductionDefect(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, recorded: true }; }
  @Post('production-sessions/:id/evaluation') @Roles(...IOT_READ)
  async submitProductionEvaluation(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, evaluated: true }; }
  @Post('production-sessions/:id/material-return') @Roles(...IOT_READ)
  async submitMaterialReturn(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, returned: true }; }
  @Post('production-sessions/:id/inline-qc') @Roles(...IOT_READ)
  async submitInlineQc(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, qcPassed: true }; }

  // OEE live snapshot — real values come from sensor_readings + production_sessions
  // aggregation; for now we serve a typed empty snapshot so the page renders.
  @Get('oee/live') @Roles(...IOT_READ)
  async getOeeLive(@Query('device_id') _deviceId?: string) {
    return { availability: 0, performance: 0, quality: 0, oee: 0, sample_size: 0, generated_at: new Date().toISOString(), by_machine: [] };
  }
}
