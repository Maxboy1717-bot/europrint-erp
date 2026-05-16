/**
 * @module finance-gl.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlPostingService } from '../domain/services/gl-posting.service';
import { GetGlEntriesQuery } from '../application/queries/get-gl-entries.query';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  FinancePostSalesInvoiceSchema, FinancePostSalesInvoiceDto,
  FinancePostPayrollSchema, FinancePostPayrollDto,
} from './dto/finance.dto';

enum Role {
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  ACCOUNTANT = 'ACCOUNTANT',
}

@ApiThrottle()
@ApiTags('Finance Gl')
@Controller('finance/gl')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceGlController {
  private readonly logger = new Logger(FinanceGlController.name);

  constructor(private commandBus: CommandBus,
    private queryBus: QueryBus,
    private glPostingService: GlPostingService) {}

  @ApiOperation({ summary: 'List gl entries' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)
  async listGlEntries(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('account') account?: string,
  ) {
    const result = await this.queryBus.execute(new GetGlEntriesQuery({ account, page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @ApiOperation({ summary: 'Post sales invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('post-sales-invoice')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinancePostSalesInvoiceSchema))
  async postSalesInvoice(@Body() body: FinancePostSalesInvoiceDto) {

      this.logger.log(`Posting sales invoice ${body.invoiceId} to GL`);
      const result = await this.glPostingService.postSalesInvoice(body.invoiceId, body.amount, body.tax);
      assertOk(result);
      return { entryId: (result).data };
    
  }

  @ApiOperation({ summary: 'Post payroll' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('post-payroll')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinancePostPayrollSchema))
  async postPayroll(@Body() body: FinancePostPayrollDto) {

      this.logger.log(`Posting payroll ${body.payrollId} to GL`);
      const result = await this.glPostingService.postPayroll(body.payrollId, body.gross, body.inps, body.jshd);
      assertOk(result);
      return { entryId: (result).data };
    
  }

  @ApiOperation({ summary: 'Get trial balance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('trial-balance')
  @Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getTrialBalance() {

      return { data: { debit: 0, credit: 0, balanced: true } };
    
  }

  @ApiOperation({ summary: 'Get ledger' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('ledger/:accountCode')
  @Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getLedger(@Param('accountCode') accountCode: string) {

      return { data: { accountCode, entries: [] as Record<string, unknown>[] } };
    
  }
}
