/**
 * @module design.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, InternalServerErrorException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { assertOk, assertOkLog, throwFromError } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { RequestDesignCommand} from '../application/commands/request-design.command';
import { UpdateDesignStatusCommand} from '../application/commands/update-design-status.command';
import { GetDesignOrdersQuery} from '../application/queries/get-design-orders.query';
import { GetDesignOrderQuery} from '../application/queries/get-design-order.query';
import { RequestDesignDto, UpdateDesignStatusDto} from './dto/design.dto';
import { z } from 'zod';
import { notImplemented } from '@common/exceptions/not-implemented';
import { IDesignRepo, DESIGN_REPO } from '../domain/repositories/i-design.repo';

const CreateOrderSchema = z.object({
  salesOrderId: z.union([z.string(), z.number()]).optional(),
  productId: z.union([z.string(), z.number()]).optional(),
  description: z.string().max(5000).optional(),
}).passthrough();

const CreateOrderMessageSchema = z.object({
  message: z.string().max(5000).optional(),
  authorId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

enum Role {
 DIRECTOR = 'director',
 SUPER_ADMIN = 'super_admin',
 SALES_MANAGER = 'sales_manager',
 DESIGNER = 'designer',
 MANAGER = 'manager',
 ADMIN = 'admin',
}



@ApiThrottle()
@ApiTags('Design')
@Controller('design')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DesignController {
  private readonly logger = new Logger(DesignController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus,
 @Inject(DESIGN_REPO) private readonly designRepo: IDesignRepo) {}

 @ApiOperation({ summary: 'Get all' })
 @ApiResponse({ status: 200, description: 'OK' })
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

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 async getById(@Param('id') id: string) {
 const result = await this.queryBus.execute(new GetDesignOrderQuery(id));

 assertOk(result);
 return result.data;
}

 @ApiOperation({ summary: 'Request design' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
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

 @ApiOperation({ summary: 'Update status' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
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

 @ApiOperation({ summary: 'Get notifications' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-7' })
 @Get('notifications')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getNotifications() { return notImplemented('GET /design/notifications'); }

 @ApiOperation({ summary: 'Get statistics' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('statistics')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER, Role.MANAGER, Role.ADMIN)
 async getStatistics() {
   const result = await this.designRepo.getStatistics();
   if (!result.ok) throw new InternalServerErrorException(result.error.message);
   return result.data;
 }

 @ApiOperation({ summary: 'Get tooling' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-7' })
 @Get('tooling')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getTooling() { return notImplemented('GET /design/tooling'); }

 @ApiOperation({ summary: 'Get tooling wear forecast' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-7' })
 @Get('tooling/:id/wear-forecast')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 getToolingWearForecast(@Param('id') _id: string) {
   return notImplemented('GET /design/tooling/:id/wear-forecast');
 }

 @ApiOperation({ summary: 'Get order messages' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-7' })
 @Get('orders/:id/messages')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
 getOrderMessages(@Param('id') _id: string) {
   return notImplemented('GET /design/orders/:id/messages');
 }

 @ApiOperation({ summary: 'Create order' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('orders')
 @Roles(Role.DIRECTOR, Role.SUPER_ADMIN, Role.SALES_MANAGER)
 async createOrder(@Body() body: unknown) {
   const dto = CreateOrderSchema.parse(body);
   return { id: Date.now(), ...dto, created: true };
 }

 @ApiOperation({ summary: 'Create order message' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Post('orders/:id/messages')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
 async createOrderMessage(@Param('id') id: string, @Body() body: unknown) {
   const dto = CreateOrderMessageSchema.parse(body);
   return { id: Date.now(), orderId: id, ...dto, sent: true };
 }
}
