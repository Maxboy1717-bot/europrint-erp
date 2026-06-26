/**
 * @module crm-deals.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards, UseInterceptors, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { Throttle} from '@nestjs/throttler';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';

const UpdateDealStageSchema = z.object({
  stageId: z.string().optional(),
  stage_id: z.string().optional(),
  statusId: z.string().optional(),
}).passthrough();

const PatchDealSchema = z.object({
  title: z.string().max(500).optional(),
  stageId: z.string().optional(),
  stage_id: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  assignedTo: z.union([z.string(), z.number()]).optional(),
  assigned_to: z.union([z.string(), z.number()]).optional(),
  description: z.string().max(2000).optional(),
  expectedClosureDate: z.string().optional(),
  expected_closure_date: z.string().optional(),
});

const QuickDealSchema = z.object({
  customerName: z.string().optional(),
  title: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  opportunity: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  companyId: z.union([z.string(), z.number()]).nullable().optional(),
  assignedTo: z.union([z.string(), z.number()]).nullable().optional(),
}).passthrough();
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '../../auth/enums/role.enum';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateDealCommand} from '../application/commands/create-deal.handler';
import { MarkDealWonCommand} from '../application/commands/mark-deal-won.handler';
import { UpdateDealCommand} from '../application/commands/update-deal.handler';
import { UpdateDealStageCommand} from '../application/commands/update-deal-stage.handler';
import { DeleteDealCommand} from '../application/commands/delete-deal.handler';
import { CreateDealDtoSchema} from './dto/create-deal.dto';
import { LOGGER} from '../../shared/infrastructure/logger.provider';
// PA1-11: DealsService retained ONLY for read paths (findAll/findOne) and the
// quick-create endpoint that does not fit the rich CreateDealCommand shape.
// All other writes flow through CommandBus.
// TODO PA1-11: replace `dealsService.create` in createQuickDeal with a
// CreateQuickDealCommand once the quick-create shape is formalised.
import { DealsService } from '../deals/deals.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';

@ApiTags('Crm Deals')
@ApiBearerAuth()
@Controller('crm/deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiThrottle()
export class CrmDealsController {
  private readonly logger = new Logger(CrmDealsController.name);

 constructor(
  private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus,
  private readonly dealsService: DealsService,
  private readonly i18n: I18nService,
 ) {}

 @ApiOperation({ summary: 'List' })
 @ApiResponse({ status: 200, description: 'OK' })
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

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getById(@Param('id') id: string) {
  this.logger.log('Fetching deal');
  // findOne already unwraps — it returns the row or throws NotFound/500. It is NOT a
  // Result envelope, so it must NOT be passed through unwrapOrThrow again (doing so read
  // `.error.message` on a plain row → "Cannot read properties of undefined").
  return await this.dealsService.findOne(String(id));
}

 @ApiOperation({ summary: 'Create' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async create(@Body() dto: unknown, @CurrentUser() user: AuthenticatedUser) {
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

 @ApiOperation({ summary: 'Mark won' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/won')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async markWon(@Param('id') id: string) {
  this.logger.log('Marking deal as won');

  // T18-C3: live crm_deals.id is a uuid — pass the string id through (Number(id)
  // produced NaN and never matched, leaving DealWonEvent unfired).
  const command = new MarkDealWonCommand(String(id));
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Update stage' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/stage')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async updateStage(@Param('id') id: string, @Body() body: unknown) {
  const dto = UpdateDealStageSchema.parse(body);
  const stageId = dto.stageId ?? dto.stage_id ?? dto.statusId;
  if (!stageId || typeof stageId !== 'string') {
    throw new BadRequestException(await this.i18n.t('errors.stageIdRequired'));
  }
  const res = await this.commandBus.execute(new UpdateDealStageCommand(String(id), stageId));
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Patch deal' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async patchDeal(@Param('id') id: string, @Body() body: unknown) {
  const dto = PatchDealSchema.parse(body);
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(dto)) {
    if (value !== undefined) sanitized[key] = value;
  }
  const res = await this.commandBus.execute(new UpdateDealCommand(String(id), sanitized));
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Delete deal' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Delete(':id')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async deleteDeal(@Param('id') id: string) {
  const res = await this.commandBus.execute(new DeleteDealCommand(String(id)));
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Create quick deal' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('quick')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async createQuickDeal(@Body() body: unknown) {
  const parsed = QuickDealSchema.parse(body);
  // Minimal quick-create: customerName → title, amount, status (defaults to 'new')
  const dto: Record<string, unknown> = {
   title:       parsed.customerName ?? parsed.title ?? 'Yangi bitim',
   opportunity: parsed.amount ?? parsed.opportunity ?? '0',
   stage_id:    parsed.status === 'new' || !parsed.status ? 'C0:NEW' : String(parsed.status),
   companyId:   parsed.companyId ?? null,
   assignedTo:  parsed.assignedTo ?? null,
  };
  this.logger.log('Creating quick deal');
  return unwrapOrThrow(await this.dealsService.create(dto));
 }
}
