import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards, UseInterceptors, Logger , InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { Throttle} from '@nestjs/throttler';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '../../auth/enums/role.enum';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateDealCommand} from '../application/commands/create-deal.handler';
import { MarkDealWonCommand} from '../application/commands/mark-deal-won.handler';
import { CreateDealDtoSchema} from './dto/create-deal.dto';
import { LOGGER} from '../../shared/infrastructure/logger.provider';

import { QUERY_TIMEOUT_MS } from '@common/constants/app.constants';
@Controller('crm/deals')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Throttle({ default: { limit: 100, ttl: QUERY_TIMEOUT_MS}})
export class CrmDealsController {
  private readonly logger = new Logger(CrmDealsController.name);

 constructor(private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus) {}

 @Get()
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async list(
  @Query('companyId') companyId: number,
  @Query('limit') limit: number = 20,
  @Query('offset') offset: number = 0,
 ) {
  this.logger.log('Listing deals');
  return {};
}

 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getById(@Param('id') id: number) {
  this.logger.log('Fetching deal');
  return {};
}

 @Post()
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async create(@Body() dto: Record<string, unknown>) {
  const validated = CreateDealDtoSchema.parse(dto);
  this.logger.log('Creating deal');

  const command = new CreateDealCommand(
   validated.companyId,
   validated.leadId,
   validated.totalAmount,
   validated.currency,
   validated.expectedClosureDate,
   validated.assignedTo,
   1,
   validated.description,
  );

  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Patch(':id/won')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async markWon(@Param('id') id: number) {
  this.logger.log('Marking deal as won');

  const command = new MarkDealWonCommand(id);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Get('list')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async listDeals(@Query('limit') _limit?: number, @Query('offset') _offset?: number) {
  return { items: [], total: 0 };
}

 @Get('quick')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async quickDeals() {
  return { items: [], total: 0 };
}

 @Post(':id/stage')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async updateStage(@Param('id') _id: number, @Body() _body: Record<string, unknown>) {
  return { updated: true };
}
}
