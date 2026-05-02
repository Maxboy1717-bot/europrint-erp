import { TashkentTimeService } from '@common/time';
import { unwrapOrThrow } from '@common/http-result';
const _time = new TashkentTimeService();
import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards, UseInterceptors, Logger , InternalServerErrorException } from '@nestjs/common';
import { Throttle} from '@nestjs/throttler';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '../../auth/enums/role.enum';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateLeadCommand} from '../application/commands/create-lead.handler';
import { QualifyLeadCommand} from '../application/commands/qualify-lead.handler';
import { ListLeadsQuery} from '../application/queries/list-leads.handler';
import { GetLeadByIdQuery} from '../application/queries/get-lead-by-id.handler';
import { CreateLeadDtoSchema} from './dto/create-lead.dto';
import { LOGGER} from '../../shared/infrastructure/logger.provider';

import { QUERY_TIMEOUT_MS } from '@common/constants/app.constants';
@Controller('crm/leads')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Throttle({ default: { limit: 100, ttl: QUERY_TIMEOUT_MS}})
export class CrmLeadsController {
  private readonly logger = new Logger(CrmLeadsController.name);

 constructor(private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus) {}

 @Get()
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async list(
  @Query('companyId') companyId: number,
  @Query('limit') limit: number = 20,
  @Query('offset') offset: number = 0,
  @Query('status') status?: string,
 ) {
  this.logger.log('Listing leads');
  const query = new ListLeadsQuery(companyId, limit, offset, status);
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @Get('quick')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async quickLeads(@Query('limit') _limit?: number) {
  return { items: [], total: 0 };
}

 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getById(@Param('id') id: number) {
  this.logger.log('Fetching lead');
  const query = new GetLeadByIdQuery(id);
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @Get(':id/emails')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getLeadEmails(@Param('id') _id: number) {
  return { items: [], total: 0 };
}

 @Post()
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async create(@Body() dto: Record<string, unknown>) {
  const validated = CreateLeadDtoSchema.parse(dto);
  this.logger.log('Creating lead');

  const command = new CreateLeadCommand(
   validated.companyId,
   validated.firstName,
   validated.lastName,
   validated.email,
   validated.phone,
   validated.source,
   1,
   validated.notes,
  );

  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Patch(':id/qualify')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async qualify(@Param('id') id: number, @Body() dto: Record<string, unknown>) {
  this.logger.log('Qualifying lead');

  const command = new QualifyLeadCommand(id, Number(dto.expectedDealAmount) || 0, _time.now());
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}
}
