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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
import { z } from 'zod';

const CreateCanteenLogSchema = z.object({
  log_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meal_name:        z.string().min(1).max(200),
  portion_count:    z.number().int().nonnegative().optional(),
  cost_per_portion: z.number().nonnegative().optional(),
  total_cost:       z.number().nonnegative().optional(),
  employees_served: z.number().int().nonnegative().optional(),
});

const UpdateCanteenLogSchema = CreateCanteenLogSchema.partial();

const SaveMroSettingsSchema = z.record(z.string());
const PatchMroSettingSchema = z.object({ value: z.string() });

const CreateEquipmentSchema = z.object({
  name: z.string().max(200).optional(),
  code: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  location: z.string().max(500).optional(),
}).passthrough();

const UpdateEquipmentStatusSchema = z.object({
  status: z.string().max(50),
}).passthrough();

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 MAINTENANCE = 'maintenance',
 TECHNICIAN = 'technician',
}

@ApiThrottle()
@ApiTags('Mro')
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
 private readonly i18n: I18nService,
 ) {}

 @ApiOperation({ summary: 'Get all' })
 @ApiResponse({ status: 200, description: 'OK' })
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

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getById(@Param('id') id: string) {
   const result = await this.maintenanceRepo.findById(id);
   if (!result.ok || !result.data) throw new NotFoundException(await this.i18n.t('errors.maintenanceOrderNotFound', { args: { id } }));
   return { statusCode: HttpStatus.OK, data: result.data };
}

 @ApiOperation({ summary: 'Stop machine' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
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

 @ApiOperation({ summary: 'Assign maintenance' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
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

 @ApiOperation({ summary: 'Complete maintenance' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
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

 @ApiOperation({ summary: 'Get spare parts' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('spare-parts')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE, Role.TECHNICIAN)
 async getSpareParts(@Query('search') search?: string) {
   return unwrapOrInternal(await this.maintenanceSvc.findSpareParts(search));
 }

 @ApiOperation({ summary: 'Get canteen stats' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('canteen/stats')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getCanteenStats() {
   return unwrapOrInternal(await this.maintenanceSvc.getCanteenStats());
 }

 @ApiOperation({ summary: 'Get cleaning schedules' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('cleaning/schedules')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getCleaningSchedules() {
   return unwrapOrInternal(await this.maintenanceSvc.findCleaningSchedules());
 }

 @ApiOperation({ summary: 'Get facilities' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('facilities')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getFacilities() {
   return unwrapOrInternal(await this.maintenanceSvc.findFacilities());
 }

 @ApiOperation({ summary: 'Get pm schedules' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('pm/schedules')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getPmSchedules() {
   return unwrapOrInternal(await this.maintenanceSvc.findPmSchedules());
 }

 @ApiOperation({ summary: 'Get utility readings' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('utility/readings')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getUtilityReadings() {
   return unwrapOrInternal(await this.maintenanceSvc.findUtilityReadings());
 }

 @ApiOperation({ summary: 'Get equipment' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('equipment')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE, Role.TECHNICIAN)
 async getEquipment(@Query() query: Record<string, unknown>) {
   return unwrapOrInternal(await this.maintenanceSvc.findEquipment(query));
 }

 @ApiOperation({ summary: 'Create equipment' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('equipment')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async createEquipment(@Body() body: unknown) {
   const dto = CreateEquipmentSchema.parse(body);
   return unwrapOrInternal(await this.maintenanceSvc.createEquipment(dto as Record<string, unknown>));
 }

 @ApiOperation({ summary: 'Update equipment status' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch('equipment/:id/status')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async updateEquipmentStatus(
   @Param('id', ParseIntPipe) id: number,
   @Body() body: unknown,
 ) {
   const dto = UpdateEquipmentStatusSchema.parse(body);
   const status = String(dto.status ?? 'active');
   return unwrapOrInternal(await this.maintenanceSvc.updateEquipmentStatus(id, status));
 }

 // ─── Oshxona / Ovqatlanish jurnali ─────────────────────────────────────────

 @ApiOperation({ summary: 'List canteen logs (oshxona kunlik jurnali)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('canteen/logs')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async listCanteenLogs(@Query('date') date?: string) {
   return unwrapOrInternal(await this.maintenanceSvc.listCanteenLogs(date));
 }

 @ApiOperation({ summary: 'Create canteen log (oshxona yozuvi qo\'shish)' })
 @ApiResponse({ status: 201, description: 'Created' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('canteen/logs')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async createCanteenLog(@Body() body: unknown) {
   const dto = CreateCanteenLogSchema.parse(body);
   return unwrapOrInternal(await this.maintenanceSvc.createCanteenLog(dto as Record<string, unknown>));
 }

 @ApiOperation({ summary: 'Update canteen log (oshxona yozuvini yangilash)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch('canteen/logs/:id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async updateCanteenLog(
   @Param('id', ParseIntPipe) id: number,
   @Body() body: unknown,
 ) {
   const dto = UpdateCanteenLogSchema.parse(body);
   return unwrapOrInternal(await this.maintenanceSvc.updateCanteenLog(id, dto as Record<string, unknown>));
 }

 // ─── MRO Sozlamalari (FAZA "Sozlama har bo'limda", 2026-07-01) ────────────

 @ApiOperation({ summary: 'MRO sozlamalarini olish' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('settings')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async getSettings() {
   return unwrapOrInternal(await this.maintenanceSvc.getSettings());
 }

 @ApiOperation({ summary: 'MRO sozlamalarini saqlash (bulk key-value)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Post('settings')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async saveSettings(@Body() body: unknown) {
   const dto = SaveMroSettingsSchema.parse(body ?? {});
   return unwrapOrInternal(await this.maintenanceSvc.saveSettings(dto));
 }

 @ApiOperation({ summary: 'Bitta MRO sozlamasini yangilash' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Patch('settings/:id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.MAINTENANCE)
 async patchSetting(@Param('id') id: string, @Body() body: unknown) {
   const dto = PatchMroSettingSchema.parse(body ?? {});
   return unwrapOrInternal(await this.maintenanceSvc.patchSetting(id, dto.value));
 }
}
