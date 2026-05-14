/**
 * @module crm-deals.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards, UseInterceptors, Logger, BadRequestException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { Throttle} from '@nestjs/throttler';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '../../auth/enums/role.enum';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateDealCommand} from '../application/commands/create-deal.handler';
import { MarkDealWonCommand} from '../application/commands/mark-deal-won.handler';
import { CreateDealDtoSchema} from './dto/create-deal.dto';
import { LOGGER} from '../../shared/infrastructure/logger.provider';
import { DealsService } from '../deals/deals.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';

@Controller('crm/deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
export class CrmDealsController {
  private readonly logger = new Logger(CrmDealsController.name);

 constructor(
  private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus,
  private readonly dealsService: DealsService,
 ) {}

 @Get()
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async list(
  @Query('companyId') companyId: number,
  @Query('limit') limit: number = 20,
  @Query('offset') offset: number = 0,
 ) {
  this.logger.log('Listing deals');
  return unwrapOrThrow(await this.dealsService.findAll({ companyId: companyId ? Number(companyId) : undefined, limit, offset }));
}

 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getById(@Param('id') id: number) {
  this.logger.log('Fetching deal');
  const result = await this.dealsService.findOne(Number(id));
  return unwrapOrThrow(result);
}

 @Post()
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async create(@Body() dto: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
  const validated = CreateDealDtoSchema.parse(dto);
  this.logger.log('Creating deal');

  const command = new CreateDealCommand(
   validated.companyId,
   validated.leadId,
   validated.totalAmount,
   validated.currency,
   validated.expectedClosureDate,
   validated.assignedTo,
   user.id,
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

 @Patch(':id/stage')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async updateStage(@Param('id') id: number, @Body() body: Record<string, unknown>) {
  const stageId = body.stageId ?? body.stage_id ?? body.statusId;
  if (!stageId || typeof stageId !== 'string') {
    throw new BadRequestException('stageId must be a non-empty string');
  }
  return unwrapOrThrow(await this.dealsService.update(Number(id), { stage_id: stageId }));
}

 @Patch(':id')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async patchDeal(@Param('id') id: number, @Body() body: Record<string, unknown>) {
  const ALLOWED_PATCH_FIELDS = new Set(['title', 'stageId', 'stage_id', 'amount', 'assignedTo', 'assigned_to', 'description', 'expectedClosureDate', 'expected_closure_date']);
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (!ALLOWED_PATCH_FIELDS.has(key)) {
      throw new BadRequestException(`Field '${key}' is not allowed in deal patch`);
    }
    sanitized[key] = body[key];
  }
  return unwrapOrThrow(await this.dealsService.update(Number(id), sanitized));
}

 @Delete(':id')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async deleteDeal(@Param('id') id: number) {
  return unwrapOrThrow(await this.dealsService.remove(Number(id)));
}

 @Post('quick')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async createQuickDeal(@Body() body: Record<string, unknown>) {
  // Minimal quick-create: customerName → title, amount, status (defaults to 'new')
  const dto: Record<string, unknown> = {
   title:       body.customerName ?? body.title ?? 'Yangi bitim',
   opportunity: body.amount ?? body.opportunity ?? '0',
   stage_id:    body.status === 'new' || !body.status ? 'C0:NEW' : String(body.status),
   companyId:   body.companyId ?? null,
   assignedTo:  body.assignedTo ?? null,
  };
  this.logger.log('Creating quick deal');
  return unwrapOrThrow(await this.dealsService.create(dto));
 }
}
