/**
 * @module sd-payments.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import { safeInt } from '../../hr/common/db-rows';import {
Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdPaymentsService } from '../application/sd-payments.service';
import { SdCreatePaymentSchema, SdCreatePaymentDto } from '../dto/sd.dto';

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin', 'accountant'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SD_ROLES)
@Controller('sd')
export class SdPaymentsController {
  private readonly logger = new Logger(SdPaymentsController.name);

  constructor(private readonly svc: SdPaymentsService) {}

  @Get('payments')
  async listPayments(
    @Query('customerId') customerId?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rList = await this.svc.list(
      customerId ? safeInt(customerId, 0) : null,
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rList);
    return _rList.data;
  }

  @Post('payments')
  @UsePipes(new ZodValidationPipe(SdCreatePaymentSchema))
  async createPayment(@Body() body: SdCreatePaymentDto) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Get('payments/debitors')
  async getDebitors(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getDebitors(safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('payments/overdue')
  async getOverdue(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getOverdue(safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('debitors')
  async getDebitorsList(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getDebitors(safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('active-rentals')
  async getActiveRentals(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getActiveRentals(safeInt(limit, 50), safeInt(offset, 0)));
  }
}
