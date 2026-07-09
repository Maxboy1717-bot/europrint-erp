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

// A lost deal must carry a reason (drives the loss-reason rollup / churn analysis). Batch 5 Item 1:
// the structured taxonomy id (lostReasonId -> crm_loss_reasons, managed in CRM funnel settings) is now
// accepted and persisted on the base deals.lost_reason_id; the free-text reason is still required.
const MarkDealLostSchema = z.object({
  reason: z.string().min(3, 'Yo\'qotish sababi majburiy (kamida 3 belgi)'),
  lostReasonId: z.coerce.number().int().positive().nullable().optional(),
});

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

// CRM-FK-01: a deal must be traceable to its master-data owner. `company_id` is the
// only FK column the create path actually persists (drizzle-crm-deals.repo.ts), so it
// is required here — an ad-hoc deal with no company/customer link breaks the SD/CRM
// pipeline (crm_deals rows with company_id/lead_id NULL cannot be attributed to a
// customer downstream). `leadId` stays optional: a quick deal legitimately may not
// originate from a lead (e.g. direct company deal), but if supplied it must be a valid
// positive id — it is threaded through to `metadata.lead_id` (see repo comment).
const QuickDealSchema = z.object({
  customerName: z.string().optional(),
  title: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  opportunity: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  companyId: z.coerce.number().int().positive('companyId majburiy va musbat bo\'lishi kerak'),
  leadId: z.coerce.number().int().positive().optional(),
  assignedTo: z.union([z.string(), z.number()]).nullable().optional(),
}).passthrough();
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '@common/constants/roles.constants';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateDealCommand} from '../application/commands/create-deal.handler';
import { MarkDealWonCommand} from '../application/commands/mark-deal-won.handler';
import { MarkDealLostCommand} from '../application/commands/mark-deal-lost.handler';
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
  @CurrentUser() user: AuthenticatedUser,
  @Query('companyId') companyId: number,
  @Query('limit') limit: number = 20,
  @Query('offset') offset: number = 0,
 ) {
  this.logger.log('Listing deals');
  // Item A: non-privileged managers see only their own deals; super_admin/admin/director see all.
  return unwrapOrThrow(await this.dealsService.findAll({ companyId: companyId ? Number(companyId) : undefined, limit, offset }, user));
}

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
  this.logger.log('Fetching deal');
  // findOne already unwraps — it returns the row or throws NotFound/500. It is NOT a
  // Result envelope, so it must NOT be passed through unwrapOrThrow again (doing so read
  // `.error.message` on a plain row → "Cannot read properties of undefined").
  // Item A: ownership-scoped — a non-privileged manager gets 404 for a deal they don't own.
  return await this.dealsService.findOne(String(id), user);
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

 @ApiOperation({ summary: 'Mark lost' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/lost')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async markLost(@Param('id') id: string, @Body() body: unknown) {
  const dto = MarkDealLostSchema.parse(body);
  this.logger.log('Marking deal as lost');

  // Mirror markWon: live crm_deals.id is a uuid — pass the string id through (Number(id)
  // produced NaN and never matched). Batch 5 Item 1: lostReasonId (optional) is now threaded to
  // the handler, which persists it on base deals.lost_reason_id alongside the free-text lost_reason.
  const command = new MarkDealLostCommand(String(id), dto.reason, dto.lostReasonId ?? undefined);
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
 async createQuickDeal(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
  const parsed = QuickDealSchema.parse(body);
  // Minimal quick-create: customerName → title, amount, status (defaults to 'new').
  // companyId is enforced non-null by QuickDealSchema (CRM-FK-01); leadId is optional
  // but, when present, is forwarded so the repo can persist it into metadata.lead_id.
  const dto: Record<string, unknown> = {
   title:       parsed.customerName ?? parsed.title ?? 'Yangi bitim',
   opportunity: parsed.amount ?? parsed.opportunity ?? '0',
   // VISION-3340 #28: 'C0:NEW' was a stale Bitrix-style stage key that never matched a
   // DEAL_STAGES column; 'qualification' is the real default (deal-status.vo.ts).
   stage_id:    parsed.status === 'new' || !parsed.status ? 'qualification' : String(parsed.status),
   companyId:   parsed.companyId,
   leadId:      parsed.leadId ?? null,
   assignedTo:  parsed.assignedTo ?? null,
  };
  this.logger.log('Creating quick deal');
  // B14 (2026-07-05): the main create() endpoint above already threads user.id into
  // created_by_id; this quick-create path never did, so every deal created here had
  // created_by_id left NULL.
  return unwrapOrThrow(await this.dealsService.create(dto, user.id));
 }
}
