import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Query, Logger , InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from 'src/common/guards/roles.guard';
import { Roles} from 'src/common/decorators/roles.decorator';
import { AuditInterceptor} from 'src/common/interceptors/audit.interceptor';
import { CreateProductionOrderCommand} from '../application/commands/create-production-order.handler';
import { ReleaseProductionOrderCommand} from '../application/commands/release-production-order.handler';
import { ProductionPlanQuery} from '../application/queries/production-plan.handler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('pp/orders')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpOrdersController {
  private readonly logger = new Logger(PpOrdersController.name);

 constructor(private commandBus: CommandBus,
  private queryBus: QueryBus) {}

 @Get()
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SEX_BOSHLIG)
 async getAll(){
  this.logger.log('Getting all production orders');
  return [];
}

 @Get(':id')
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SEX_BOSHLIG)
 async getById(@Param('id') id: number){
  this.logger.log('Getting production order');
  return {};
}

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
