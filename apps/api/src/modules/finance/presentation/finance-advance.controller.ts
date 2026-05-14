/**
 * @module finance-advance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Post, Get, Body, Query, UseGuards, UseInterceptors, Logger, UsePipes } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CheckAdvanceHandler, CheckAdvanceCommand } from '../application/commands/check-advance.handler';
import { FinanceActionsService } from '../application/finance-actions.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  FinanceRequestAdvanceSchema, FinanceRequestAdvanceDto,
  FinanceOverrideAdvanceSchema, FinanceOverrideAdvanceDto,
} from './dto/finance.dto';

enum Role {
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/advances')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceAdvanceController {
  private readonly logger = new Logger(FinanceAdvanceController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private checkAdvanceHandler: CheckAdvanceHandler,
    private readonly advanceSvc: FinanceActionsService,
  ) {}

  @Get()
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async listAdvances(@Query('page') page?: string, @Query('limit') limit?: string) {
    const lim = Math.min(Number(limit) || 20, 100);
    const pageNum = Math.max(1, Number(page));
    const off = (pageNum - 1) * lim;
    const r = await this.advanceSvc.listAdvances(lim, off, pageNum);
    const payload = r.ok ? r.data : { items: [], total: 0, page: pageNum, limit: lim };
    return { data: payload };
  }

  @Post('request')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceRequestAdvanceSchema))
  async requestAdvance(@Body() body: FinanceRequestAdvanceDto) {
    this.logger.log(`Advance request for employee ${body.employeeId}, Amount: ${body.amount}`);
    const command = new CheckAdvanceCommand(body.employeeId, body.amount, body.requestedBy);
    const result = await this.checkAdvanceHandler.execute(command);
    return { status: unwrapOrThrow(result).status };
  }

  @Post('override')
  @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceOverrideAdvanceSchema))
  async overrideAdvance(@Body() body: FinanceOverrideAdvanceDto) {
    this.logger.log(`Overriding advance for employee ${body.employeeId}`);
    const command = new CheckAdvanceCommand(body.employeeId, body.amount, 0, body.overriddenBy, body.reason);
    const result = await this.checkAdvanceHandler.execute(command);
    return { status: unwrapOrThrow(result).status };
  }

  @Get('pending')
  @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
  async getPendingAdvances() {
    const r = await this.advanceSvc.getPendingAdvances();
    const pendingAdvances = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { pendingAdvances } };
  }
}
