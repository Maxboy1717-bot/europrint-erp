import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FiService } from '../fi/fi.service';
import { CreateAccountingPeriodSchema, CreatePaymentSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const FI_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('fi')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FI_ROLES)
export class FiController {
  constructor(private readonly svc: FiService) {}

  @Get('accounting-periods')
  async getAccountingPeriods(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAccountingPeriods(query));
  }

  @Post('accounting-periods')
  async createAccountingPeriod(@Body() body: Record<string, unknown>) {
    const dto = CreateAccountingPeriodSchema.parse(body);
    return unwrapOrInternal(await this.svc.createAccountingPeriod(dto));
  }

  @Post('accounting-periods/:id/close')
  async closeAccountingPeriod(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.closeAccountingPeriod(id));
  }

  @Post('gl-documents/:id/post')
  async postGlDocument(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.postGlDocument(id));
  }

  @Get('payments')
  async getPayments(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findPayments(query));
  }

  @Post('payments')
  async createPayment(@Body() body: Record<string, unknown>) {
    const dto = CreatePaymentSchema.parse(body);
    return unwrapOrInternal(await this.svc.createPayment(dto as Record<string, unknown>));
  }
}
