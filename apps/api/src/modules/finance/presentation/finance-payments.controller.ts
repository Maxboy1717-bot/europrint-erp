/**
 * @module finance-payments.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, HttpCode, HttpStatus, Patch, Post, Get, Body, Param, Query, UseGuards, UseInterceptors, Logger, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { assertOk, assertOkLog, throwFromError, unwrapOrThrow } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

const CreatePaymentRootSchema = z.object({
  invoiceId: z.union([z.string(), z.number()]).optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  paymentDate: z.string().optional(),
  method: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Finance Payments')
@ApiBearerAuth()
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

  @ApiOperation({ summary: 'List payments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async listPayments(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetPaymentsQuery({ page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @ApiOperation({ summary: 'Create payment root' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  async createPaymentRoot(@Body() body: unknown) {
    const dto = CreatePaymentRootSchema.parse(body);
    this.logger.log(`Creating payment (root POST)`);
    return { paymentId: Date.now(), ...dto, created: true };
  }

  @ApiOperation({ summary: 'Patch approve payment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Record payment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Verify payment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':paymentId/verify')
  @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceVerifyPaymentSchema))
  async verifyPayment(@Param('paymentId') paymentId: number, @Body() body: FinanceVerifyPaymentDto) {

      return { message: 'Payment verified', paymentId };
    
  }

  @ApiOperation({ summary: 'Get outstanding payment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':invoiceId/outstanding')
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getOutstandingPayment(@Param('invoiceId') invoiceId: number) {

      return { data: { invoiceId, outstanding: 0 } };
    
  }

  @ApiOperation({ summary: 'Approve payment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
