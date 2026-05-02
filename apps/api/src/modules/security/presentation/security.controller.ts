import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, InternalServerErrorException} from '@nestjs/common';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { UpdateIncidentCommand} from '../application/commands/update-incident.command';
import { ResolveIncidentCommand} from '../application/commands/resolve-incident.handler';
import { GetIncidentsQuery} from '../application/queries/get-incidents.query';
import { ReportIncidentDto, UpdateIncidentDto, ResolveIncidentDto} from './dto/security.dto';

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SECURITY = 'security',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('security')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

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
 this.logger.log('Get incident');
 return {
 statusCode: HttpStatus.OK,
 data: { id},
};
}

 @Post('/report')
 async reportIncident(
 @Body() dto: ReportIncidentDto,
 @CurrentUser() user: AuthenticatedUser) {
 this.logger.warn('Security incident reported');
 return {
 statusCode: HttpStatus.CREATED,
 data: { id: 'incident_id', title: dto.title, severity: dto.severity},
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
}
