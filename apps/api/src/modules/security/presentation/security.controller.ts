/**
 * @module security.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { BadRequestException, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, InternalServerErrorException, Logger, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';


import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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

 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async getById(@Param('id') id: string) {
   const result = await this.incidentRepo.findById(id);
   if (!result.ok || !result.data) throw new NotFoundException(`Hodisa #${id} topilmadi`);
   return { statusCode: HttpStatus.OK, data: result.data };
}

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

 @Post('visitors/:id/exit')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async recordVisitorExit(@Param('id') id: string) {
   return { visitorId: id, exitedAt: _time.now().toISOString(), status: 'exited' };
 }

 @Get('visitors')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getVisitors() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

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

 @Get('access-zones')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getAccessZones(@Query() query: Record<string, unknown>) {
   return unwrapOrThrow(await this.accessSvc.findAll(query));
 }

 @Get('attendance-records')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async getAttendanceRecords(@Query() query: Record<string, unknown>) {
   return unwrapOrThrow(await this.attendanceSvc.findAll(query));
 }

 @Get('daily-summary')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getDailySummary() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

 @Get('fire-sensors')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getFireSensors() { throw new HttpException('Yong\'in sensorlari tez orada', HttpStatus.NOT_IMPLEMENTED); }

 @Get('ppe-checks')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getPpeChecks() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

 @Get('ppe-stats')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getPpeStats() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

 @Get('ppe-violations')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 getPpeViolations() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

 @Patch('visitors/:id/exit')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECURITY)
 async patchVisitorExit(@Param('id') id: string) {
   return { visitorId: id, exitedAt: _time.now().toISOString(), status: 'exited' };
 }
}
