/**
 * @module pp-orders.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Query, Logger , InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from 'src/common/guards/roles.guard';
import { Roles} from 'src/common/decorators/roles.decorator';
import { AuditInterceptor} from 'src/common/interceptors/audit.interceptor';
import { CreateProductionOrderCommand} from '../application/commands/create-production-order.handler';
import { ReleaseProductionOrderCommand} from '../application/commands/release-production-order.handler';
import { ProductionPlanQuery} from '../application/queries/production-plan.handler';
import { GetProductionOrdersQuery } from '../application/queries/get-production-orders.query';
import { GetProductionOrderByIdQuery } from '../application/queries/get-production-order-by-id.query';
import { z } from 'zod';

enum Role {
 TECHNOLOGIST = 'technologist',
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SEX_BOSHLIG = 'sex_boshlig',
}

const CreateProductionOrderDtoSchema = z.object({
  soId: z.number(),
  bomId: z.number(),
  routingId: z.number(),
  plannedStart: z.coerce.date(),
  plannedEnd: z.coerce.date(),
  checkpointValidated: z.boolean(),
  reason: z.string().min(5),
});

const ReleaseProductionOrderDtoSchema = z.object({
  reason: z.string().min(5),
});

@ApiThrottle()
@ApiTags('Pp Orders')
@Controller('pp/orders')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpOrdersController {
  private readonly logger = new Logger(PpOrdersController.name);

 constructor(private commandBus: CommandBus,
  private queryBus: QueryBus) {}

 @ApiOperation({ summary: 'Get all' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SEX_BOSHLIG)
 async getAll(
   @Query('status') status?: string,
   @Query('salesOrderId') salesOrderId?: string,
   @Query('from') from?: string,
   @Query('to') to?: string,
   @Query('page') page?: string,
   @Query('limit') limit?: string,
 ) {
  this.logger.log('Getting all production orders');
  const query = new GetProductionOrdersQuery({
    status,
    salesOrderId,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SEX_BOSHLIG)
 async getById(@Param('id') id: number) {
  this.logger.log(`Getting production order id=${id}`);
  const query = new GetProductionOrderByIdQuery(Number(id));
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Create' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
 @Roles(Role.SUPER_ADMIN)
 async create(
  @Body()
  dto: z.infer<typeof CreateProductionOrderDtoSchema>,
 ){
  const parsed = CreateProductionOrderDtoSchema.parse(dto);
  const command = new CreateProductionOrderCommand(
   parsed.soId,
   parsed.bomId,
   parsed.routingId,
   parsed.plannedStart,
   parsed.plannedEnd,
   parsed.checkpointValidated,
  );
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Release' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch(':id/release')
 @Roles(Role.SUPER_ADMIN)
 async release(
  @Param('id') id: number,
  @Body() dto: z.infer<typeof ReleaseProductionOrderDtoSchema>,
 ){
  ReleaseProductionOrderDtoSchema.parse(dto);
  const command = new ReleaseProductionOrderCommand(id);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Get production plan' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('/plan/:startDate/:endDate')
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SEX_BOSHLIG)
 async getProductionPlan(
  @Param('startDate') startDate: string,
  @Param('endDate') endDate: string,
 ){
  const query = new ProductionPlanQuery(new Date(startDate), new Date(endDate));
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}
}
