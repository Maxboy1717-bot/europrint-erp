/**
 * @module kanban.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, InternalServerErrorException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { CreateTaskCommand} from '../application/commands/create-task.command';
import { UpdateTaskCommand} from '../application/commands/update-task.command';
import { DeleteTaskCommand} from '../application/commands/delete-task.command';
import { GetTasksQuery} from '../application/queries/get-tasks.query';
import { GetTaskQuery} from '../application/queries/get-task.query';
import { CreateTaskDto, UpdateTaskDto} from './dto/kanban.dto';

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SALES_MANAGER = 'sales_manager',
 WAREHOUSE_MANAGER = 'warehouse_manager',
}

@ApiThrottle()
@ApiTags('Kanban')
@ApiBearerAuth()
@Controller('kanban')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class KanbanController {
  private readonly logger = new Logger(KanbanController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

 @ApiOperation({ summary: 'Get all' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.WAREHOUSE_MANAGER)
 async getAll(
 @Query('status') status?: string,
 @Query('assignedTo') assignedTo?: string,
 @Query('page') page?: string,
 @Query('limit') limit?: string) {
 const filters = {
 status,
 assignedTo,
 page: page ? parseInt(page, 10) : 1,
 limit: limit ? parseInt(limit, 10) : 10,
};

 const result = await this.queryBus.execute(new GetTasksQuery(filters));

 assertOk(result);
 return result.data;
}

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.WAREHOUSE_MANAGER)
 async getById(@Param('id') id: string) {
 const result = await this.queryBus.execute(new GetTaskQuery(id));

 assertOk(result);
 return result.data;
}

 @ApiOperation({ summary: 'Create' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.WAREHOUSE_MANAGER)
 async create(
 @Body() dto: CreateTaskDto,
 @CurrentUser() user: AuthenticatedUser) {
 const cmd = new CreateTaskCommand(
 dto.title,
 dto.description || '',
 'default-board',
 user.id,
 dto.priority);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Kanban task created');

 return result.data;
}

 @ApiOperation({ summary: 'Update' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.WAREHOUSE_MANAGER)
 async update(
 @Param('id') id: string,
 @Body() dto: UpdateTaskDto,
 @CurrentUser() user: AuthenticatedUser) {
 const cmd = new UpdateTaskCommand(
 id,
 dto.status,
 dto.title,
 dto.description,
 dto.assignedTo,
 dto.priority,
 dto.dueDate,
 String(user.id));

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Kanban task updated');

 return result.data;
}

 @ApiOperation({ summary: 'Delete' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Delete(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.WAREHOUSE_MANAGER)
 async delete(
 @Param('id') id: string,
 @CurrentUser() user: AuthenticatedUser) {
 const cmd = new DeleteTaskCommand(id, String(user.id));

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Kanban task deleted');

 return {
 statusCode: HttpStatus.OK,
 data: { message: 'Kanban task deleted successfully'},
};
}
}
