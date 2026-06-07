/**
 * @module finance-invoices.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, HttpCode, HttpStatus, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger, UsePipes, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { GetInvoicesQuery } from '../application/queries/get-invoices.query';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  FinanceCreateInvoiceSchema, FinanceCreateInvoiceDto,
  FinancePostInvoiceSchema, FinancePostInvoiceDto,
} from './dto/finance.dto';
import { FinanceInvoiceRepo } from '../infrastructure/repositories/drizzle-finance-invoice.repo';

const CreateInvoiceRootSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

enum Role {
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
}

@ApiThrottle()
@ApiTags('Finance Invoices')
@Controller('finance/invoices')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceInvoicesController {
  private readonly logger = new Logger(FinanceInvoicesController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly invoiceRepo: FinanceInvoiceRepo,
  ) {}

  @ApiOperation({ summary: 'List invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async listInvoices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.queryBus.execute(new GetInvoicesQuery({ status, page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @ApiOperation({ summary: 'Create invoice root' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  async createInvoiceRoot(@Body() body: unknown) {
    const dto = CreateInvoiceRootSchema.parse(body);
    this.logger.log(`Creating invoice (root POST)`);
    const invoiceNumber = `INV-${Date.now()}`;
    const result = await this.invoiceRepo.saveInvoice({
      customer_id: dto.customerId ?? null,
      source_type: 'manual',
      source_id: null,
      status: 'draft',
      total_amount: dto.amount ?? 0,
      paid_amount: 0,
      due_date: dto.dueDate ?? null,
      notes: dto.notes ?? null,
      created_at: new Date(),
    } as Record<string, unknown>);
    if (!result.ok) {
      throw new InternalServerErrorException('Invoice yaratilmadi');
    }
    const row = result.data as Record<string, unknown>;
    return { invoiceId: row['id'], invoiceNumber, ...dto, created: true };
  }

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('create')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceCreateInvoiceSchema))
  async createInvoice(@Body() body: FinanceCreateInvoiceDto) {
    this.logger.log(`Creating invoice for customer ${body.customerId}, Amount: ${body.amount}`);
    const invoiceNumber = `INV-${Date.now()}`;
    const result = await this.invoiceRepo.saveInvoice({
      customer_id: body.customerId,
      source_type: 'manual',
      source_id: null,
      status: 'draft',
      total_amount: body.amount,
      paid_amount: 0,
      due_date: body.dueDate,
      notes: body.description,
      created_at: new Date(),
    } as Record<string, unknown>);
    if (!result.ok) {
      throw new InternalServerErrorException('Invoice yaratilmadi');
    }
    const row = result.data as Record<string, unknown>;
    return { invoiceId: row['id'], invoiceNumber };
  }

  @ApiOperation({ summary: 'Post invoice to GL' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':invoiceId/post')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinancePostInvoiceSchema))
  async postInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() body: FinancePostInvoiceDto,
  ) {
    const result = await this.invoiceRepo.postInvoiceWithGl(
      invoiceId,
      body.amount,
      body.taxAmount ?? 0,
      body.postedBy,
    );
    if (!result.ok) {
      throw new InternalServerErrorException('Invoice GL postlanmadi');
    }
    if (result.data.alreadyPosted) {
      return { message: 'Invoice already posted to GL (idempotent)', invoiceId };
    }
    return { message: 'Invoice posted to GL', invoiceId, entryId: result.data.entryId };
  }

  @ApiOperation({ summary: 'Get invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':invoiceId')
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getInvoice(@Param('invoiceId') invoiceId: number) {
    const result = await this.invoiceRepo.findInvoiceById(String(invoiceId));
    if (!result.ok) {
      throw new InternalServerErrorException('Invoice topishda xatolik');
    }
    if (!result.data) {
      throw new NotFoundException(`Invoice ${invoiceId} topilmadi`);
    }
    return { data: result.data };
  }
}
