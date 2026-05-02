import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, InternalServerErrorException} from '@nestjs/common';
import { assertOk, assertOkOrThrow, throwFromError, unwrapOrWarn } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { CreateBudgetCommand} from '../application/commands/create-budget.command';
import { ApproveBudgetCommand} from '../application/commands/approve-budget.command';
import { SubmitBudgetForApprovalCommand} from '../application/commands/submit-budget-for-approval.command';
import { GetBudgetsQuery} from '../application/queries/get-budgets.query';
import { GetBudgetVarianceQuery} from '../application/queries/get-budget-variance.query';
import { GetBudgetStatsQuery} from '../application/queries/get-budget-stats.query';
import {
 CreateBudgetDtoSchema,
 GetBudgetsDtoSchema,
} from './dto/budget.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/budgets')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceBudgetsController {
 private readonly logger = new Logger(FinanceBudgetsController.name);

 constructor(private commandBus: CommandBus,
 private queryBus: QueryBus) {}

 @Get()
 @Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async getBudgets(@Query() query: Record<string, unknown>) {
   const validated = GetBudgetsDtoSchema.parse(query);
   const result = await this.queryBus.execute(new GetBudgetsQuery(validated.fiscalYear, validated.status, validated.department, validated.page, validated.limit));
   return unwrapOrWarn(result, (e) => this.logger.warn(`getBudgets: ${e?.message ?? String(e)}`), { items: [], total: 0 });
 }

 @Get('stats')
 @Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async getBudgetStats(@Query('fiscalYear') fiscalYear: string) {
   const year = parseInt(fiscalYear, 10) || _time.now().getFullYear();
   this.logger.debug(`Fetching budget stats for fiscal year: ${year}`);
   const result = await this.queryBus.execute(new GetBudgetStatsQuery(year));
   return unwrapOrWarn(result, (e) => this.logger.warn(`getBudgetStats: ${e?.message ?? String(e)}`), { totalBudget: 0, totalActual: 0, variance: 0 });
 }

 @Get(':id')
 @Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async getBudgetById(@Param('id') id: string) {
   this.logger.debug(`Fetching budget: ${id}`);
   const result = await this.queryBus.execute(new (class GetBudgetByIdQuery { constructor(public id: string) {} })(id));
   assertOkOrThrow(result, (e) => this.logger.warn(`getBudgetById(${id}): ${e?.message ?? String(e)}`), new NotFoundException(`Byudjet topilmadi: ${id}`));
   return result.data;
 }

 @Get(':id/variance')
 @Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async getBudgetVariance(@Param('id') budgetId: string) {
   this.logger.debug(`Fetching budget variance: ${budgetId}`);
   const result = await this.queryBus.execute(new GetBudgetVarianceQuery(budgetId));
   return unwrapOrWarn(result, (e) => this.logger.warn(`getBudgetVariance(${budgetId}): ${e?.message ?? String(e)}`), { items: [], variance: 0 });
 }

 @Post()
 @Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async createBudget(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {

 const validated = CreateBudgetDtoSchema.parse(body);

 this.logger.debug(`Creating budget: ${validated.name}`);

 const result = await this.commandBus.execute(
 new CreateBudgetCommand(
 validated.name,
 validated.fiscalYear,
 validated.quarter || null,
 validated.department || null,
 (validated.lines || []) as import("../application/commands/create-budget.command").BudgetLineInput[],
 validated.notes || null,
 String(user.sub || user.id),
 ),
 );

 assertOk(result);
 return result.data;

}

 @Patch(':id/submit')
 @Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async submitBudgetForApproval(@Param('id') budgetId: string) {

 this.logger.log(`Submitting budget for approval: ${budgetId}`);

 const result = await this.commandBus.execute(
 new SubmitBudgetForApprovalCommand(budgetId),
 );

 assertOk(result);
 return result.data;

}

 @Patch(':id/approve')
 @Roles('SUPER_ADMIN', 'DIRECTOR')
 async approveBudget(@Param('id') budgetId: string, @CurrentUser() user: AuthenticatedUser) {

 this.logger.log(`Approving budget: ${budgetId}`);

 const result = await this.commandBus.execute(
 new ApproveBudgetCommand(budgetId, String(user.sub || user.id)),
 );

 assertOk(result);
 return result.data;

}
}
