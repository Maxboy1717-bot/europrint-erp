/**
 * @module security.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { BadRequestException, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, InternalServerErrorException, Logger, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';


import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { UpdateIncidentCommand} from '../application/commands/update-incident.command';
import { ResolveIncidentCommand} from '../application/commands/resolve-incident.handler';
import { GetIncidentsQuery} from '../application/queries/get-incidents.query';
import { ReportIncidentCommand } from '../application/commands/report-incident.command';
import { ReportIncidentDto, UpdateIncidentDto, ResolveIncidentDto} from './dto/security.dto';
import { IIncidentRepo, INCIDENT_REPO } from '../domain/repositories/i-incident.repo';
import { AttendanceService } from '../attendance/attendance.service';
import { AccessService } from '../access/access.service';
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
type Rows = { rows?: unknown[] };

const VisitorCreateSchema = z.object({
  fullName: z.string().max(500).default(''),
  company: z.string().max(500).optional(),
  purpose: z.string().max(500).optional(),
  hostEmployeeName: z.string().max(500).optional(),
  badgeNumber: z.string().max(100).optional(),
}).passthrough();

const IncidentCreateSchema = z.object({
  type: z.string().max(100).default('general'),
  description: z.string().max(2000).optional(),
  severity: z.string().max(50).default('medium'),
  location: z.string().max(500).optional(),
  reportedBy: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const PpeCheckCreateSchema = z.object({
  employeeName: z.string().max(500).default(''),
  department: z.string().max(500).optional(),
  helmetOk: z.boolean().default(true),
  vestOk: z.boolean().default(true),
  glovesOk: z.boolean().default(true),
  bootsOk: z.boolean().default(true),
  notes: z.string().max(2000).optional(),
}).passthrough();

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SECURITY = 'security',
}



@ApiThrottle()
@ApiTags('Security')
@ApiBearerAuth()
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus,
 @Inject(INCIDENT_REPO) private readonly incidentRepo: IIncidentRepo,
 private readonly attendanceSvc: AttendanceService,
 private readonly accessSvc: AccessService,
 private readonly i18n: I18nService,
 ) {}

 @ApiOperation({ summary: 'Get all' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async getAll(
 @Query('severity') severity?: string,
 @Query('status') status?: string,
 @Query('page') page?: string,
 @Query('limit') limit?: string) {
 const filters = {
 severity,
 status,
 page: page ? parseInt(page, 10) : 1,
 limit: limit ? parseInt(limit, 10) : 10,
};

 const result = await this.queryBus.execute(new GetIncidentsQuery(filters));

 assertOk(result);
 return result.data;
}

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async getById(@Param('id') id: string) {
   const result = await this.incidentRepo.findById(id);
   if (!result.ok || !result.data) throw new NotFoundException(await this.i18n.t('errors.incidentNotFoundWithId', { args: { id } }));
   return { statusCode: HttpStatus.OK, data: result.data };
}

 @ApiOperation({ summary: 'Report incident' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('/report')
 @HttpCode(HttpStatus.CREATED)
 async reportIncident(
 @Body() dto: ReportIncidentDto,
 @CurrentUser() user: AuthenticatedUser) {
   const incidentId: string = await this.commandBus.execute(
     new ReportIncidentCommand('general', dto.severity, dto.title, dto.description, user.id),
   );
   return {
     statusCode: HttpStatus.CREATED,
     data: { id: incidentId, title: dto.title, severity: dto.severity },
   };
}

 @ApiOperation({ summary: 'Update incident' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async updateIncident(
 @Param('id') id: string,
 @Body() dto: UpdateIncidentDto) {
 const cmd = new UpdateIncidentCommand(id, dto.assignedTo, dto.status, dto.resolutionNotes);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Incident updated');

 return result.data;
}

 @ApiOperation({ summary: 'Resolve incident' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch(':id/resolve')
 @Roles(Role.SUPER_ADMIN)
 async resolveIncident(
 @Param('id') id: string,
 @Body() dto: ResolveIncidentDto) {
 const cmd = new ResolveIncidentCommand(id, dto.resolutionNotes);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Incident resolved - reporter notified');

 return result.data;
}

 @ApiOperation({ summary: 'Record visitor exit' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Post('visitors/:id/exit')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async recordVisitorExit(@Param('id') id: string) {
   await db.execute(sql`UPDATE security_visitors SET exited_at=NOW(), status='exited' WHERE id=${parseInt(id, 10)}`);
   return { visitorId: id, exitedAt: _time.now().toISOString(), status: 'exited' };
 }

 @ApiOperation({ summary: 'Get visitors' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('visitors')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getVisitors() {
   const r = await db.execute(sql`SELECT id, full_name, company, purpose, host_employee_name, entered_at, exited_at, badge_number, status FROM security_visitors ORDER BY created_at DESC LIMIT 50`);
   return (r as unknown as { rows: unknown[] }).rows ?? [];
 }

 @ApiOperation({ summary: 'Get incidents' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('incidents')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getIncidents(
   @Query('severity') severity?: string,
   @Query('status') status?: string,
   @Query('page') page?: string,
   @Query('limit') limit?: string,
 ) {
   return unwrapOrThrow(await this.queryBus.execute(new GetIncidentsQuery({ severity, status, page: Number(page ?? 1), limit: Number(limit ?? 20) })));
 }

 @ApiOperation({ summary: 'Get access zones' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('access-zones')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getAccessZones(@Query() query: Record<string, unknown>) {
   return unwrapOrThrow(await this.accessSvc.findAll(query));
 }

 @ApiOperation({ summary: 'Get attendance records' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('attendance-records')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getAttendanceRecords(@Query() query: Record<string, unknown>) {
   return unwrapOrThrow(await this.attendanceSvc.findAll(query));
 }

 @ApiOperation({ summary: 'Get daily summary' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('daily-summary')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getDailySummary() {
   const r = await db.execute(sql`
     SELECT
       (SELECT COUNT(*)::int FROM security_incidents WHERE created_at::date = CURRENT_DATE) AS incidents_today,
       (SELECT COUNT(*)::int FROM security_visitors WHERE entered_at::date = CURRENT_DATE) AS visitors_today,
       (SELECT COUNT(*)::int FROM security_visitors WHERE status = 'active') AS visitors_on_site,
       (SELECT COUNT(*)::int FROM security_ppe_checks WHERE created_at::date = CURRENT_DATE) AS ppe_checks_today,
       (SELECT COUNT(*)::int FROM security_ppe_checks WHERE created_at::date = CURRENT_DATE
          AND NOT (helmet_ok AND vest_ok AND gloves_ok AND boots_ok)) AS ppe_violations_today
   `);
   return ((r as Rows).rows ?? [])[0] ?? {
     incidents_today: 0, visitors_today: 0, visitors_on_site: 0,
     ppe_checks_today: 0, ppe_violations_today: 0,
   };
 }

 @ApiOperation({ summary: 'Get fire sensors' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-6' })
 @Get('fire-sensors')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getFireSensors() { return notImplemented('GET /security/fire-sensors'); }

 @ApiOperation({ summary: 'Get ppe checks' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('ppe-checks')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getPpeChecks(@Query('limit') limit?: string) {
   const lim = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
   const r = await db.execute(sql`
     SELECT id, employee_name, department, helmet_ok, vest_ok, gloves_ok, boots_ok, notes, checked_by, created_at
     FROM security_ppe_checks ORDER BY created_at DESC LIMIT ${lim}
   `);
   return (r as Rows).rows ?? [];
 }

 @ApiOperation({ summary: 'Get ppe stats' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('ppe-stats')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getPpeStats() {
   const r = await db.execute(sql`
     SELECT
       COUNT(*)::int AS total_checks,
       COUNT(*) FILTER (WHERE helmet_ok AND vest_ok AND gloves_ok AND boots_ok)::int AS compliant_count,
       COUNT(*) FILTER (WHERE NOT (helmet_ok AND vest_ok AND gloves_ok AND boots_ok))::int AS violation_count,
       COUNT(*) FILTER (WHERE NOT helmet_ok)::int AS helmet_violations,
       COUNT(*) FILTER (WHERE NOT vest_ok)::int AS vest_violations,
       COUNT(*) FILTER (WHERE NOT gloves_ok)::int AS gloves_violations,
       COUNT(*) FILTER (WHERE NOT boots_ok)::int AS boots_violations,
       ROUND(
         COUNT(*) FILTER (WHERE helmet_ok AND vest_ok AND gloves_ok AND boots_ok)::numeric
         / NULLIF(COUNT(*), 0) * 100, 1
       ) AS compliance_percent
     FROM security_ppe_checks
   `);
   return ((r as Rows).rows ?? [])[0] ?? {
     total_checks: 0, compliant_count: 0, violation_count: 0,
     helmet_violations: 0, vest_violations: 0, gloves_violations: 0, boots_violations: 0,
     compliance_percent: 0,
   };
 }

 @ApiOperation({ summary: 'Get ppe violations' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('ppe-violations')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getPpeViolations(@Query('limit') limit?: string) {
   const lim = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
   const r = await db.execute(sql`
     SELECT id, employee_name, department, helmet_ok, vest_ok, gloves_ok, boots_ok, notes, checked_by, created_at
     FROM security_ppe_checks
     WHERE NOT (helmet_ok AND vest_ok AND gloves_ok AND boots_ok)
     ORDER BY created_at DESC LIMIT ${lim}
   `);
   return (r as Rows).rows ?? [];
 }

 @ApiOperation({ summary: 'Patch visitor exit' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch('visitors/:id/exit')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async patchVisitorExit(@Param('id') id: string) {
   await db.execute(sql`UPDATE security_visitors SET exited_at=NOW(), status='exited' WHERE id=${parseInt(id, 10)}`);
   return { visitorId: id, exitedAt: _time.now().toISOString(), status: 'exited' };
 }

 @ApiOperation({ summary: 'Create visitor' })
 @ApiResponse({ status: 201, description: 'OK' })
 @Post('visitors')
 @HttpCode(HttpStatus.CREATED)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async createVisitor(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
   const dto = VisitorCreateSchema.parse(body);
   const r = await db.execute(sql`
     INSERT INTO security_visitors
       (full_name, company, purpose, host_employee_name, badge_number, status, entered_at, created_by, created_at)
     VALUES
       (${dto.fullName}, ${dto.company ?? null}, ${dto.purpose ?? null},
        ${dto.hostEmployeeName ?? ''}, ${dto.badgeNumber ?? null},
        'active', NOW(), ${user.id}, NOW())
     RETURNING *
   `);
   const row = ((r as Rows).rows ?? [])[0] ?? {};
   return { data: row };
 }

 @ApiOperation({ summary: 'Create incident' })
 @ApiResponse({ status: 201, description: 'OK' })
 @Post('incidents')
 @HttpCode(HttpStatus.CREATED)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async createIncident(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
   const dto = IncidentCreateSchema.parse(body);
   const r = await db.execute(sql`
     INSERT INTO security_incidents
       (type, description, severity, location, reported_by, status, created_by, created_at, updated_at)
     VALUES
       (${dto.type}, ${dto.description ?? null}, ${dto.severity},
        ${dto.location ?? ''}, ${user.id}, 'open', ${user.id}, NOW(), NOW())
     RETURNING *
   `);
   const row = ((r as Rows).rows ?? [])[0] ?? {};
   return { data: row };
 }

 @ApiOperation({ summary: 'Create PPE check' })
 @ApiResponse({ status: 201, description: 'OK' })
 @Post('ppe-checks')
 @HttpCode(HttpStatus.CREATED)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async createPpeCheck(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
   const dto = PpeCheckCreateSchema.parse(body);
   const r = await db.execute(sql`
     INSERT INTO security_ppe_checks
       (employee_name, department, helmet_ok, vest_ok, gloves_ok, boots_ok, notes, checked_by, created_at)
     VALUES
       (${dto.employeeName}, ${dto.department ?? null},
        ${dto.helmetOk}, ${dto.vestOk}, ${dto.glovesOk}, ${dto.bootsOk},
        ${dto.notes ?? null}, ${user.id}, NOW())
     RETURNING *
   `);
   const row = ((r as Rows).rows ?? [])[0] ?? {};
   return { data: row };
 }
}
