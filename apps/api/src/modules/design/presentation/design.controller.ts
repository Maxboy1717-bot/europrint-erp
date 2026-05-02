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
import { assertOk, assertOkLog, throwFromError } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { RequestDesignCommand} from '../application/commands/request-design.command';
import { UpdateDesignStatusCommand} from '../application/commands/update-design-status.command';
import { GetDesignOrdersQuery} from '../application/queries/get-design-orders.query';
import { GetDesignOrderQuery} from '../application/queries/get-design-order.query';
import { RequestDesignDto, UpdateDesignStatusDto} from './dto/design.dto';

enum Role {
 DIRECTOR = 'director',
 SUPER_ADMIN = 'super_admin',
 SALES_MANAGER = 'sales_manager',
 DESIGNER = 'designer',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('design')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DesignController {
  private readonly logger = new Logger(DesignController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

 @Get()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
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

 const result = await this.queryBus.execute(new GetDesignOrdersQuery(filters));

 assertOk(result);
 return result.data;
}

 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 async getById(@Param('id') id: string) {
 const result = await this.queryBus.execute(new GetDesignOrderQuery(id));

 assertOk(result);
 return result.data;
}

 @Post()
 @Roles(Role.DIRECTOR, Role.SUPER_ADMIN, Role.SALES_MANAGER)
 async requestDesign(
 @Body() dto: RequestDesignDto,
 @CurrentUser() user: AuthenticatedUser) {
 const cmd = new RequestDesignCommand(
 dto.salesOrderId ? parseInt(dto.salesOrderId, 10) : 0,
 0, // productId from schema
 dto.description,
 user.id);

 const result = await this.commandBus.execute(cmd);

 assertOkLog(result, () => this.logger.error({ salesOrderId: dto.salesOrderId }, 'Failed to request design'));

 this.logger.log(
 { designOrderId: result.data, salesOrderId: dto.salesOrderId},
 'Design requested');

 return result.data;
}

 @Patch(':id/status')
 @Roles(Role.DESIGNER, Role.SUPER_ADMIN)
 async updateStatus(
 @Param('id') id: string,
 @Body() dto: UpdateDesignStatusDto,
 @CurrentUser() user: AuthenticatedUser) {
 const cmd = new UpdateDesignStatusCommand(
 id,
 dto.status,
 String(user.id),
 dto.files);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Design status updated');

 return result.data;
}

 @Get('notifications')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getNotifications() {
   return { items: [], total: 0 };
 }

 @Get('statistics')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getStatistics() {
   return { totalOrders: 0, completed: 0, pending: 0, inProgress: 0 };
 }

 @Get('tooling')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getTooling() {
   return { items: [], total: 0 };
 }

 @Get('tooling/:id/wear-forecast')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getToolingWearForecast(@Param('id') _id: string) {
   return { forecast: [], riskLevel: 'low' };
 }

 @Get('orders/:id/messages')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
 getOrderMessages(@Param('id') _id: string) {
   return { items: [], total: 0 };
 }
}
