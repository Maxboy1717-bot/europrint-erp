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
import { ProductionOrdersService } from '../production-orders/production-orders.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { z } from 'zod';

enum Role {
 TECHNOLOGIST = 'technologist',
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SEX_BOSHLIG = 'sex_boshlig',
}

// SB0237 (06-PP audit): EP-PP-025/061 frozen-zone — "Cleared only by owner/director
// authority" (production-priority.service.ts header). ZARUR (isUrgent) va freeze
// bir xil authority-darajasi: rejalashtirish jarayonini o'zgartiradigan qaror.
const FlagsDtoSchema = z.object({
  isUrgent: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  frozenUntil: z.coerce.date().nullable().optional(),
  reason: z.string().min(5),
  // VISION-3340 #23: optional structured reason (pp_reason_codes.id). Complements the
  // free-text `reason` above — a flagged order can now point at a reusable reason code.
  reasonCodeId: z.coerce.number().int().positive().optional(),
}).refine(
  (d) => d.isUrgent !== undefined || d.isFrozen !== undefined || d.frozenUntil !== undefined,
  { message: 'Kamida bitta flag maydoni kerak' },
);

const CreateProductionOrderDtoSchema = z.object({
  soId: z.number(),
  bomId: z.number(),
  routingId: z.number(),
  plannedStart: z.coerce.date(),
  plannedEnd: z.coerce.date(),
  checkpointValidated: z.boolean(),
  reason: z.string().min(5),
  // SB0233 (06-PP audit): ixtiyoriy org-karta (org_departments.id) tayinlash.
  orgDepartmentId: z.number().int().positive().optional(),
});

const ReleaseProductionOrderDtoSchema = z.object({
  reason: z.string().min(5),
});

// EP-PP-082: drive the production order through its 9-status lifecycle. `status` is
// validated against the aggregate's PoStatus + PO_STATUS_TRANSITIONS in the service
// (unknown → 400, illegal hop → 400); `reason` is the mandatory written justification
// (#2/#39) now persisted on production_order_status_log.reason.
const UpdateStatusDtoSchema = z.object({
  status: z.string().min(1),
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
  private queryBus: QueryBus,
  private productionOrdersService: ProductionOrdersService) {}

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
   parsed.orgDepartmentId,
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

 // SB0237 (06-PP audit): ZARUR (isUrgent, EP-PP-097) / frozen-zone (isFrozen+
 // frozenUntil, EP-PP-025/061 no-preempt) — "Cleared only by owner/director
 // authority" (production-priority.service.ts). Restricted to SUPER_ADMIN + DIRECTOR
 // only (narrower than the read-side queue roles) — this is a planning-override
 // decision, not an operational status change.
 @ApiOperation({ summary: 'Set urgent/frozen flags (owner/director authority)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/flags')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async setFlags(
  @Param('id') id: number,
  @Body() dto: z.infer<typeof FlagsDtoSchema>,
 ) {
  const parsed = FlagsDtoSchema.parse(dto);
  this.logger.log(`Setting PP order #${id} flags: ${JSON.stringify({ isUrgent: parsed.isUrgent, isFrozen: parsed.isFrozen, frozenUntil: parsed.frozenUntil, reasonCodeId: parsed.reasonCodeId })}`);
  const result = await this.productionOrdersService.updateFlags(Number(id), {
   isUrgent: parsed.isUrgent,
   isFrozen: parsed.isFrozen,
   frozenUntil: parsed.frozenUntil,
   reasonCodeId: parsed.reasonCodeId,
  });
  return unwrapOrThrow(result);
 }

 // EP-PP-082 (rows #2/#6/#39/#88): the production-order status lifecycle + audit journal.
 // The 9-status state machine + canTransition + the status-log writer were already built
 // but unreachable — this route activates them. Operational status changes (shop chief +
 // director + admin), narrower than the read-side queue roles but broader than the
 // planning-override flags path.
 @ApiOperation({ summary: 'Update production-order status (lifecycle transition + audit log)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Unknown status or illegal transition' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/status')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SEX_BOSHLIG)
 async updateStatus(
  @Param('id') id: number,
  @Body() dto: z.infer<typeof UpdateStatusDtoSchema>,
  @CurrentUser() user: AuthenticatedUser,
 ) {
  const parsed = UpdateStatusDtoSchema.parse(dto);
  this.logger.log(`PP order #${id} status -> ${parsed.status} by user ${user?.id}`);
  const result = await this.productionOrdersService.updateStatus(Number(id), parsed.status, user?.id, parsed.reason);
  return unwrapOrThrow(result);
 }
}
