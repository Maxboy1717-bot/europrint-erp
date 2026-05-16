/**
 * @module sd-invoices.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk } from '@common/http-result';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, NotFoundException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { CreateInvoiceCommand } from '../application/commands/create-invoice.command';
import { GetInvoicesQuery } from '../application/queries/get-invoices.query';
import { GetInvoiceQuery } from '../application/queries/get-invoice.query';
import {
  CreateInvoiceDtoSchema,
  GetInvoicesDtoSchema,
} from './dto/sd-invoice.dto';

const Role = {
  FINANCE_MANAGER: 'finance_manager',
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  SALES_MANAGER: 'sales_manager',
} as const;

@ApiThrottle()
@ApiTags('Sd Invoices')
@ApiBearerAuth()
@Controller('sd/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SdInvoicesController {
  private readonly logger = new Logger(SdInvoicesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
  async getInvoices(@Query() queryParams: Record<string, unknown>) {

      const parsed = GetInvoicesDtoSchema.parse(queryParams);
      const query = new GetInvoicesQuery(
        parsed.salesOrderId,
        parsed.status,
        parsed.from ? new Date(parsed.from) : undefined,
        parsed.to ? new Date(parsed.to) : undefined,
        parsed.page,
        parsed.limit,
      );

      const result = await this.queryBus.execute(query);

      assertOk(result);
      return (result).data;
    
  }

  @ApiOperation({ summary: 'Get invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
  async getInvoice(@Param('id') id: string) {

      const query = new GetInvoiceQuery(id);
      const result = await this.queryBus.execute(query);

      assertOk(result);
      return (result).data;
    
  }

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.SALES_MANAGER)
  async createInvoice(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

      const parsed = CreateInvoiceDtoSchema.parse(body);
      const cmd = new CreateInvoiceCommand(
        parsed.salesOrderId,
        parsed.customerName,
        parsed.items as import('../application/commands/create-invoice.command').InvoiceItem[],
        new Date(parsed.dueDate),
        parsed.notes || null,
        String(user.id),
      );

      const result = await this.commandBus.execute(cmd);

      assertOk(result);
      this.logger.log('Invoice created successfully');
      return (result).data;
    
  }
}
