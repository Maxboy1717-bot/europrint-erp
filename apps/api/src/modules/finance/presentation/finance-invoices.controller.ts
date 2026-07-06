/**
 * @module finance-invoices.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, HttpCode, HttpStatus, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger, UsePipes, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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
import { GlPostingService } from '../domain/services/gl-posting.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';

interface AuthenticatedUser { id: number; sub?: number; }

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
    private readonly gl: GlPostingService,
    private readonly i18n: I18nService,
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
  async createInvoiceRoot(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateInvoiceRootSchema.parse(body);
    this.logger.log(`Creating invoice (root POST)`);
    // C4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): invoice_number is now generated server-side by
    // saveInvoice() via the invoice_number_seq sequence (collision-proof) — no client-side
    // Date.now() value is computed or sent; the actual saved number comes back in `row`.
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
      created_by: user?.sub ?? user?.id ?? null,
    } as Record<string, unknown>);
    if (!result.ok) {
      throw new InternalServerErrorException(await this.i18n.t('errors.invoiceNotCreated'));
    }
    const row = result.data as Record<string, unknown>;
    return { invoiceId: row['id'], invoiceNumber: row['invoice_number'], ...dto, created: true };
  }

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('create')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(FinanceCreateInvoiceSchema))
  async createInvoice(@Body() body: FinanceCreateInvoiceDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Creating invoice for customer ${body.customerId}, Amount: ${body.amount}`);
    // C4: see createInvoiceRoot() above — invoice_number now comes from saveInvoice()'s
    // sequence-based generation, not a client-side Date.now() value.
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
      created_by: user?.sub ?? user?.id ?? null,
    } as Record<string, unknown>);
    if (!result.ok) {
      throw new InternalServerErrorException(await this.i18n.t('errors.invoiceNotCreated'));
    }
    const row = result.data as Record<string, unknown>;
    return { invoiceId: row['id'], invoiceNumber: row['invoice_number'] };
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
    // #10 GL-unify: post the GL legs through the ONE engine (DR AR / CR Revenue + VAT, resolved to
    // entries._id via the chart of accounts), then flip the invoice status. Idempotency = invoice status.
    const existing = await this.invoiceRepo.findInvoiceById(invoiceId);
    if (existing.ok && existing.data && (existing.data as Record<string, unknown>)['status'] === 'posted') {
      return { message: 'Invoice already posted to GL (idempotent)', invoiceId };
    }
    const glR = await this.gl.postSalesInvoice(invoiceId, body.amount, body.taxAmount ?? 0);
    if (!glR.ok) {
      throw new InternalServerErrorException(await this.i18n.t('errors.invoiceGlNotPosted'));
    }
    const flip = await this.invoiceRepo.markInvoicePosted(invoiceId);
    if (!flip.ok) {
      throw new InternalServerErrorException(await this.i18n.t('errors.invoiceStatusNotUpdated'));
    }
    return { message: 'Invoice posted to GL', invoiceId, entryId: glR.data };
  }

  @ApiOperation({ summary: 'Get invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':invoiceId')
  @Roles(Role.FINANCE_OFFICER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async getInvoice(@Param('invoiceId') invoiceId: number) {
    const result = await this.invoiceRepo.findInvoiceById(String(invoiceId));
    if (!result.ok) {
      throw new InternalServerErrorException(await this.i18n.t('errors.invoiceFetchFailed'));
    }
    if (!result.data) {
      throw new NotFoundException(await this.i18n.t('errors.invoiceNotFoundWithId', { args: { invoiceId } }));
    }
    return { data: result.data };
  }
}
