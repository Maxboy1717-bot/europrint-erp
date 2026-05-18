/**
 * @module security.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { BadRequestException, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, InternalServerErrorException, Logger, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';


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

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SECURITY = 'security',
}

// FEATURE_FLAGGED: security dashboard aggregates (daily-summary, fire-sensors,
// PPE checks/stats/violations) not yet wired to a service (tracking #FX-6).
const secNotImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};

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
   if (!result.ok || !result.data) throw new NotFoundException(`Hodisa #${id} topilmadi`);
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
   return { visitorId: id, exitedAt: _time.now().toISOString(), status: 'exited' };
 }

 @ApiOperation({ summary: 'Get visitors' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('visitors')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getVisitors() { return []; }

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
 @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-6' })
 @Get('daily-summary')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getDailySummary() { return secNotImplemented('GET /security/daily-summary'); }

 @ApiOperation({ summary: 'Get fire sensors' })
 @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-6' })
 @Get('fire-sensors')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getFireSensors() { return secNotImplemented('GET /security/fire-sensors'); }

 @ApiOperation({ summary: 'Get ppe checks' })
 @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-6' })
 @Get('ppe-checks')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getPpeChecks() { return secNotImplemented('GET /security/ppe-checks'); }

 @ApiOperation({ summary: 'Get ppe stats' })
 @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-6' })
 @Get('ppe-stats')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getPpeStats() { return secNotImplemented('GET /security/ppe-stats'); }

 @ApiOperation({ summary: 'Get ppe violations' })
 @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-6' })
 @Get('ppe-violations')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getPpeViolations() { return secNotImplemented('GET /security/ppe-violations'); }

 @ApiOperation({ summary: 'Patch visitor exit' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch('visitors/:id/exit')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async patchVisitorExit(@Param('id') id: string) {
   return { visitorId: id, exitedAt: _time.now().toISOString(), status: 'exited' };
 }
}
