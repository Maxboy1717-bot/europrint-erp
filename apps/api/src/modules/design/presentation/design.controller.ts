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
  UseInterceptors, BadRequestException, InternalServerErrorException, NotImplementedException} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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
import { IDesignRepo, DESIGN_REPO } from '../domain/repositories/i-design.repo';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

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
 @Inject(DESIGN_REPO) private readonly designRepo: IDesignRepo,
 private readonly i18n: I18nService) {}

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
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('notifications')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 async getNotifications() {
   const r = await db.execute(sql`SELECT * FROM "designOrderNotifications" ORDER BY "createdAt" DESC LIMIT 50`);
   const items = ((r as { rows?: unknown[] }).rows) ?? [];
   return { items, total: items.length };
 }

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
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('tooling')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 async getTooling() {
   const r = await db.execute(sql`SELECT * FROM design_tooling WHERE deleted_at IS NULL ORDER BY created_at DESC`);
   const items = ((r as { rows?: unknown[] }).rows) ?? [];
   return { items, total: items.length };
 }

 @ApiOperation({ summary: 'Get tooling wear forecast' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('tooling/:id/wear-forecast')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
 async getToolingWearForecast(@Param('id') id: string) {
   const r = await db.execute(sql`
     SELECT id, tooling_number, name, wear_percentage, max_usage_count, total_usage_count,
       CASE
         WHEN max_usage_count > 0 THEN GREATEST(0, max_usage_count - total_usage_count)
         ELSE NULL
       END AS remaining_uses,
       next_maintenance_date
     FROM design_tooling WHERE id=${parseInt(id, 10)} AND deleted_at IS NULL LIMIT 1
   `);
   const row = (((r as { rows?: unknown[] }).rows) ?? [])[0] ?? null;
   if (!row) throw new BadRequestException(await this.i18n.t('errors.toolingNotFoundWithId', { args: { id } }));
   return { data: row };
 }

 @ApiOperation({ summary: 'Get order messages' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('orders/:id/messages')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
 async getOrderMessages(@Param('id') id: string) {
   const r = await db.execute(sql`SELECT * FROM "designOrderMessages" WHERE "orderId"=${id} ORDER BY "createdAt" ASC`);
   const items = ((r as { rows?: unknown[] }).rows) ?? [];
   return { items, total: items.length };
 }

 @ApiOperation({ summary: 'Create order' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('orders')
 @Roles(Role.DIRECTOR, Role.SUPER_ADMIN, Role.SALES_MANAGER)
 async createOrder(@Body() body: unknown) {
   CreateOrderSchema.parse(body);
   // 501: a real design-request path already exists (POST /design -> requestDesign, canonical,
   // linked to salesOrderId). The thin DTO cannot satisfy design_orders NOT NULL columns
   // (order_number, client_name, product_type, product_name) without guessing; an orphan design
   // order would be worse than the fake-create. Fragmented design-create surface (createOrder fake
   // + requestDesign real + orphan OrdersService.create + 2 schema defs) — unification tracked for
   // a later design-module cleanup stage.
   throw new NotImplementedException(await this.i18n.t('errors.useRequestDesignEndpoint'));
 }

 @ApiOperation({ summary: 'Create order message' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Post('orders/:id/messages')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
 async createOrderMessage(@Param('id') id: string, @Body() body: unknown) {
   const dto = CreateOrderMessageSchema.parse(body);
   const r = await db.execute(sql`
     INSERT INTO "designOrderMessages" ("orderId", "senderId", "senderName", message, is_read, "createdAt")
     VALUES (${id}, ${String(dto.authorId ?? '')}, ${String(dto.authorId ?? '')}, ${dto.message ?? ''}, false, NOW())
     RETURNING *
   `);
   const row = (((r as { rows?: unknown[] }).rows) ?? [])[0] ?? {};
   return { data: row };
 }
}
