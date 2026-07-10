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
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
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

const PatchDeviceSchema = z.object({
  name:     z.string().max(200).optional(),
  location: z.string().max(500).optional(),
  status:   z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

// 07-pp#38 — Director "eng yomon stanok" OEE reytingi: ixtiyoriy sana oralig'i (shift_date).
const WorstMachineQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const IOT_READ = ['super_admin', 'director', 'production_manager', 'technologist'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager'];

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

  // -- Machine status ----------------------------------------------------------
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

  // -- Environment / sensors ---------------------------------------------------
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
  @ApiResponse({ status: 501, description: 'Energiya sensori o\'rnatilmagan (EP-IOT-018-PENDING)' })
  @Get('energy-consumption')
  @Roles(...IOT_READ)
  async getEnergyConsumption(@Query() raw: Record<string, unknown>) {
    // EP-IOT-018 (owner override, audit EP-IOT-018/030): energiya sensorlari
    // FIZIKAN o'rnatilmagan. Bu endpoint AVVAL seed qilingan soxta sensor
    // ma'lumotini (SNS-E-MAIN) 200 bilan qaytarardi — bu egasi taqiqlagan
    // soxta javob. Owner MAJBURAN halol 501 talab qildi (Qoida 10/17 dan
    // istisno: bu yagona, egasi-mandatli halol 501). Sensor o'rnatilganda
    // shu yerda real query tiklanadi.
    DeviceIdQuerySchema.parse(raw);
    throw new HttpException(
      { message: "Energiya sensori o'rnatilmagan", code: 'EP-IOT-018-PENDING' },
      HttpStatus.NOT_IMPLEMENTED,
    );
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

  // -- Production / OEE --------------------------------------------------------
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

  // 07-pp#38 — Director "eng yomon stanok": OEE% asosiy mezon (o'suvchi reyting),
  // brak% ALOHIDA flag (brak% > work_centers.brak_limit_pct). Static path — 'oee'
  // va 'oee/live' bilan to'qnashmaydi.
  @ApiOperation({ summary: 'Get worst-machine OEE ranking (Director)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee/worst-machines')
  @Roles(...IOT_READ)
  async getWorstMachines(@Query() raw: Record<string, unknown>) {
    const q = WorstMachineQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getWorstMachineRanking(q.from, q.to));
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
  @Get('downtime-reason-codes') @Roles(...IOT_READ)
  async getDowntimeReasonCodes() {
    // VISION-3340 16.60/16.61: repointed from the EMPTY downtime_reason_codes table
    // (0 rows, name/name_ru columns) to the LIVE mes_downtime_reasons catalog (16 rows),
    // so the tablet downtime picker renders real reasons (the submit button is disabled
    // until one is selected — an empty list made downtime un-submittable). Mirrors
    // legacy-iot.service.ts getIotTabletDefectReasons: id + code + name AS labelUz +
    // COALESCE(drc.name_ru, name) AS labelRu (LEFT JOIN downtime_reason_codes for the RU
    // fallback; that table is empty so it falls back to the Uzbek name — Russian appears
    // automatically once seeded) + category AS stage. Returns a BARE ARRAY — the FE
    // (useIoTTabletData) maps over it directly (a {items,total} object would not be an array).
    const r = await db.execute(sql`
      SELECT
        dr.id                                     AS id,
        dr.code                                   AS code,
        dr.name                                   AS "labelUz",
        COALESCE(drc.name_ru, dr.name)            AS "labelRu",
        dr.category                               AS stage
      FROM mes_downtime_reasons dr
      LEFT JOIN downtime_reason_codes drc ON drc.code = dr.code
      WHERE dr.is_active = true
      ORDER BY dr.code
    `);
    const rows = (r as { rows?: unknown[] }).rows;
    return Array.isArray(rows) ? rows : [];
  }

  // -- Device patch ------------------------------------------------------------
  @ApiOperation({ summary: 'Patch device' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('devices/:id') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchDevice(@Param('id') id: string, @Body() body: unknown) {
    const dto = PatchDeviceSchema.parse(body);
    await db.execute(sql`
      UPDATE iot_devices SET
        name=COALESCE(${dto.name ?? null}, name),
        location=COALESCE(${dto.location ?? null}, location),
        status=COALESCE(${dto.status ?? null}, status),
        updated_at=NOW()
      WHERE id=${parseInt(id, 10)}
    `);
    return { id: parseInt(id, 10), updated: true };
  }

  // OEE live snapshot - aggregated from production_sessions (real data source).
  // oee_records table exists but has 0 rows; production_sessions has availability/
  // performance/quality/oee columns with real numeric values from IoT devices.
  @ApiOperation({ summary: 'Get oee live' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee/live') @Roles(...IOT_READ)
  async getOeeLive(@Query('device_id') deviceId?: string) {
    // (1) AVG summary — recent active sessions (last 8 h or running/in_progress).
    const machineIdFilter = deviceId
      ? sql`AND machine_id = ${parseInt(deviceId, 10)}`
      : sql``;

    const summaryResult = await db.execute(sql`
      SELECT AVG(availability)::numeric(6,2) AS availability,
             AVG(performance)::numeric(6,2)  AS performance,
             AVG(quality)::numeric(6,2)      AS quality,
             AVG(oee)::numeric(6,2)          AS oee,
             COUNT(*)::int                   AS sample_size
      FROM production_sessions
      WHERE deleted_at IS NULL
        AND (
          updated_at >= NOW() - INTERVAL '8 hours'
          OR status IN ('running', 'in_progress')
        )
        ${machineIdFilter}
    `);
    const summaryRows = (summaryResult as unknown as { rows: Record<string, unknown>[] }).rows ?? [];
    const row = summaryRows[0];

    // (2) GROUP BY machine_id for the by_machine breakdown.
    const byMachineResult = await db.execute(sql`
      SELECT machine_id,
             AVG(availability)::numeric(6,2) AS availability,
             AVG(performance)::numeric(6,2)  AS performance,
             AVG(quality)::numeric(6,2)      AS quality,
             AVG(oee)::numeric(6,2)          AS oee,
             COUNT(*)::int                   AS sample_size
      FROM production_sessions
      WHERE deleted_at IS NULL
        AND machine_id IS NOT NULL
        AND (
          updated_at >= NOW() - INTERVAL '8 hours'
          OR status IN ('running', 'in_progress')
        )
        ${machineIdFilter}
      GROUP BY machine_id
      ORDER BY machine_id
    `);
    const byMachineRows = (byMachineResult as unknown as { rows: Record<string, unknown>[] }).rows ?? [];

    return {
      availability: Number(row?.availability ?? 0),
      performance:  Number(row?.performance  ?? 0),
      quality:      Number(row?.quality      ?? 0),
      oee:          Number(row?.oee          ?? 0),
      sample_size:  Number(row?.sample_size  ?? 0),
      generated_at: new Date().toISOString(),
      by_machine: byMachineRows.map(m => ({
        machine_id:   Number(m.machine_id),
        availability: Number(m.availability ?? 0),
        performance:  Number(m.performance  ?? 0),
        quality:      Number(m.quality      ?? 0),
        oee:          Number(m.oee          ?? 0),
        sample_size:  Number(m.sample_size  ?? 0),
      })),
    };
  }
}
