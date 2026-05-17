/**
 * @module iot-main.controller
 * @description IoT main controller. Hosts dashboard, machine-status, environment/sensors,
 *              OEE, and device-detail endpoints. After Rule 13/16 split, alerts moved to
 *              iot-alerts.controller and tablet/production-sessions/material-kit stubs
 *              moved to iot-tablet.controller.
 */
import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IotMainService } from '../application/iot-main.service';
import { IotSensorsExtendedService } from '../application/iot-sensors-extended.service';
import {
  DeptLimitQuerySchema,
  DeviceIdQuerySchema,
  EmployeeHealthQuerySchema,
  MachineLogsQuerySchema,
  OeeQuerySchema,
  QualityDefectsCameraQuerySchema,
  ShiftReportQuerySchema,
  StatusLimitQuerySchema,
} from './dto/iot-camera.dto';

const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};

const PatchDeviceSchema = z.object({
  name:     z.string().max(200).optional(),
  location: z.string().max(500).optional(),
  status:   z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

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

  // ── Machine status ──────────────────────────────────────────────────────────
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

  @ApiOperation({ summary: 'Get employee productivity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-productivity')
  @Roles(...IOT_READ)
  async getEmployeeProductivity(@Query() raw: Record<string, unknown>) {
    const q = DeptLimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeProductivity(q.department_id, q.limit));
  }

  // ── Environment / sensors ───────────────────────────────────────────────────
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

  // ── Production / OEE ────────────────────────────────────────────────────────
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

  // ── Device patch ────────────────────────────────────────────────────────────
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

  // OEE live snapshot — real values come from sensor_readings + production_sessions
  // aggregation; for now we serve a typed empty snapshot so the page renders.
  @ApiOperation({ summary: 'Get oee live' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee/live') @Roles(...IOT_READ)
  async getOeeLive(@Query('device_id') _deviceId?: string) {
    return { availability: 0, performance: 0, quality: 0, oee: 0, sample_size: 0, generated_at: new Date().toISOString(), by_machine: [] };
  }
}
