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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CreateInvoiceCommand } from '../application/commands/create-invoice.command';
import { GetInvoicesQuery } from '../application/queries/get-invoices.query';
import { GetInvoiceQuery } from '../application/queries/get-invoice.query';
import {
  CreateInvoiceDtoSchema,
  GetInvoicesDtoSchema,
} from './dto/sd-invoice.dto';

enum Role {
  FINANCE_MANAGER = 'finance_manager',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
  SALES_MANAGER = 'sales_manager',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('sd/invoices')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SdInvoicesController {
  private readonly logger = new Logger(SdInvoicesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @Get(':id')
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
  async getInvoice(@Param('id') id: string) {

      const query = new GetInvoiceQuery(id);
      const result = await this.queryBus.execute(query);

      assertOk(result);
      return (result).data;
    
  }

  @Post()
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.SALES_MANAGER)
  async createInvoice(@Body() body: Record<string, unknown>) {

      const parsed = CreateInvoiceDtoSchema.parse(body);
      const cmd = new CreateInvoiceCommand(
        parsed.salesOrderId,
        parsed.customerName,
        parsed.items as import('../application/commands/create-invoice.command').InvoiceItem[],
        new Date(parsed.dueDate),
        parsed.notes || null,
        'system-user',
      );

      const result = await this.commandBus.execute(cmd);

      assertOk(result);
      this.logger.log('Invoice created successfully');
      return (result).data;
    
  }
}
