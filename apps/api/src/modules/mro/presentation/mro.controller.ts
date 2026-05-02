import {
  Body,
  Controller,
  Get,
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
import { StopMachineCommand} from '../application/commands/stop-machine.command';
import { AssignMaintenanceCommand} from '../application/commands/assign-maintenance.command';
import { CompleteMaintenanceCommand} from '../application/commands/complete-maintenance.handler';
import { GetMaintenanceOrdersQuery} from '../application/queries/get-maintenance-orders.query';
import { StopMachineDto, AssignMaintenanceDto, CompleteMaintenanceDto} from './dto/mro.dto';

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 MAINTENANCE = 'maintenance',
 TECHNICIAN = 'technician',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('mro')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MroController {
  private readonly logger = new Logger(MroController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

 @Get()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getAll(
 @Query('status') status?: string,
 @Query('priority') priority?: string,
 @Query('assignedTo') assignedTo?: string,
 @Query('page') page?: string,
 @Query('limit') limit?: string) {
 const filters = {
 status,
 priority,
 assignedTo,
 page: page ? parseInt(page, 10) : 1,
 limit: limit ? parseInt(limit, 10) : 10,
};

 const result = await this.queryBus.execute(new GetMaintenanceOrdersQuery(filters));

 assertOk(result);
 return result.data;
}

 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getById(@Param('id') id: string) {
 this.logger.log('Get maintenance order');
 return {
 statusCode: HttpStatus.OK,
 data: { id},
};
}

 @Post('/stop-machine')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE, Role.TECHNICIAN)
 async stopMachine(
 @Body() dto: StopMachineDto,
 @CurrentUser() user: AuthenticatedUser) {
 const cmd = new StopMachineCommand(dto.equipmentId, dto.equipmentId);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Trigger 18: Machine stopped - PP will reschedule');

 return result.data;
}

 @Patch(':id/assign')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async assignMaintenance(
 @Param('id') id: string,
 @Body() dto: AssignMaintenanceDto) {
 const cmd = new AssignMaintenanceCommand(id, dto.assignedTo);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Maintenance assigned');

 return result.data;
}

 @Patch(':id/complete')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async completeMaintenance(
 @Param('id') id: string,
 @Body() dto?: CompleteMaintenanceDto) {
 const cmd = new CompleteMaintenanceCommand(id);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Maintenance completed');

 return result.data;
}
}
