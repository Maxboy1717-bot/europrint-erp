/**
 * @module mro.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
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
import { IMaintenanceRepo, MAINTENANCE_REPO } from '../domain/repositories/i-maintenance.repo';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { unwrapOrInternal } from '@common/http-result';

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
 private readonly queryBus: QueryBus,
 @Inject(MAINTENANCE_REPO) private readonly maintenanceRepo: IMaintenanceRepo,
 private readonly maintenanceSvc: MaintenanceService,
 ) {}

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
   const result = await this.maintenanceRepo.findById(id);
   if (!result.ok || !result.data) throw new NotFoundException(`Ta'mirlash buyurtmasi #${id} topilmadi`);
   return { statusCode: HttpStatus.OK, data: result.data };
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

 @Get('spare-parts')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE, Role.TECHNICIAN)
 async getSpareParts(@Query('search') search?: string) {
   return unwrapOrInternal(await this.maintenanceSvc.findSpareParts(search));
 }

 @Get('canteen/stats')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getCanteenStats() {
   return unwrapOrInternal(await this.maintenanceSvc.getCanteenStats());
 }

 @Get('cleaning/schedules')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getCleaningSchedules() {
   return unwrapOrInternal(await this.maintenanceSvc.findCleaningSchedules());
 }

 @Get('facilities')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getFacilities() {
   return unwrapOrInternal(await this.maintenanceSvc.findFacilities());
 }

 @Get('pm/schedules')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getPmSchedules() {
   return unwrapOrInternal(await this.maintenanceSvc.findPmSchedules());
 }

 @Get('utility/readings')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getUtilityReadings() {
   return unwrapOrInternal(await this.maintenanceSvc.findUtilityReadings());
 }

 @Get('equipment')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE, Role.TECHNICIAN)
 async getEquipment(@Query() query: Record<string, unknown>) {
   return unwrapOrInternal(await this.maintenanceSvc.findEquipment(query));
 }

 @Post('equipment')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async createEquipment(@Body() body: Record<string, unknown>) {
   return unwrapOrInternal(await this.maintenanceSvc.createEquipment(body));
 }

 @Patch('equipment/:id/status')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async updateEquipmentStatus(
   @Param('id', ParseIntPipe) id: number,
   @Body() body: Record<string, unknown>,
 ) {
   const status = String(body.status ?? 'active');
   return unwrapOrInternal(await this.maintenanceSvc.updateEquipmentStatus(id, status));
 }
}
