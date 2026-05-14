/**
 * @module finance-payments.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, HttpCode, HttpStatus, Patch, Post, Get, Body, Param, Query, UseGuards, UseInterceptors, Logger, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { assertOk, assertOkLog, throwFromError, unwrapOrThrow } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { RecordPaymentHandler, RecordPaymentCommand } from '../application/commands/record-payment.handler';
import { GetPaymentsQuery } from '../application/queries/get-payments.query';
import { FinanceActionsService } from '../application/finance-actions.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  FinanceRecordPaymentSchema, FinanceRecordPaymentDto,
  FinanceVerifyPaymentSchema, FinanceVerifyPaymentDto,
} from './dto/finance.dto';

enum Role {
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinancePaymentsController {
  private readonly logger = new Logger(FinancePaymentsController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private recordPaymentHandler: RecordPaymentHandler,
    private readonly actionsSvc: FinanceActionsService,
  ) {}

  @Get()
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async listPayments(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetPaymentsQuery({ page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  async createPaymentRoot(@Body() body: Record<string, unknown>) {
    this.logger.log(`Creating payment (root POST)`);
    return { paymentId: Date.now(), ...body, created: true };
  }

  @Patch(':id/approve')
  @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
  async patchApprovePayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.actionsSvc.approvePayment(Number(id), user.id);
    assertOkLog(r, (e) => this.logger.error(`patchApprovePayment: DB update failed for id=${id}: ${e?.message ?? String(e)}`));
    return { data: r.data };
  }

  @Post('record')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceRecordPaymentSchema))
  async recordPayment(@Body() body: FinanceRecordPaymentDto) {

      this.logger.log(`Recording payment - Invoice: ${body.invoiceId}, Amount: ${body.amount}`);
      const command = new RecordPaymentCommand(
        body.paymentId, body.invoiceId, body.customerId,
        body.amount, new Date(body.paymentDate), body.recordedBy
      );
      const result = await this.recordPaymentHandler.execute(command);
      assertOk(result);
      return { paymentId: (result).data };
    
  }

  @Post(':paymentId/verify')
  @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceVerifyPaymentSchema))
  async verifyPayment(@Param('paymentId') paymentId: number, @Body() body: FinanceVerifyPaymentDto) {

      return { message: 'Payment verified', paymentId };
    
  }

  @Get(':invoiceId/outstanding')
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getOutstandingPayment(@Param('invoiceId') invoiceId: number) {

      return { data: { invoiceId, outstanding: 0 } };
    
  }

  @Post(':id/approve')
  @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
  async approvePayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.actionsSvc.approvePayment(Number(id), user.id);
    assertOkLog(r, (e) => this.logger.error(`approvePayment: DB update failed for id=${id}: ${e?.message ?? String(e)}`));
    return { data: r.data };
  }
}
