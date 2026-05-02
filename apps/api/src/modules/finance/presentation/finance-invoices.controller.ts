import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger, UsePipes } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GetInvoicesQuery } from '../application/queries/get-invoices.query';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  FinanceCreateInvoiceSchema, FinanceCreateInvoiceDto,
  FinancePostInvoiceSchema, FinancePostInvoiceDto,
} from './dto/finance.dto';

import { FINANCE_RANDOM_REF_RANGE } from '@common/constants/app.constants';
enum Role {
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/invoices')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceInvoicesController {
  private readonly logger = new Logger(FinanceInvoicesController.name);

  constructor(private commandBus: CommandBus,
    private queryBus: QueryBus) {}

  @Get()
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async listInvoices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return await this.queryBus.execute(new GetInvoicesQuery({ status, page: Number(page), limit: Number(limit) }));
  }

  @Post('create')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceCreateInvoiceSchema))
  async createInvoice(@Body() body: FinanceCreateInvoiceDto) {

      this.logger.log(`Creating invoice for customer ${body.customerId}, Amount: ${body.amount}`);
      return {
        invoiceId: Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE),
        invoiceNumber: `INV-${Date.now()}`,
      };
    
  }

  @Post(':invoiceId/post')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinancePostInvoiceSchema))
  async postInvoice(
    @Param('invoiceId') invoiceId: number,
    @Body() body: FinancePostInvoiceDto
  ) {

      return { message: 'Invoice posted to GL', invoiceId };
    
  }

  @Get(':invoiceId')
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getInvoice(@Param('invoiceId') invoiceId: number) {

      return { data: { invoiceId, status: 'posted' } };
    
  }
}
