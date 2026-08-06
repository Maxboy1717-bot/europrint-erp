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
  Req,
  Res,
  UseGuards,
  UseInterceptors, BadRequestException, NotFoundException, InternalServerErrorException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentAccessLogService } from '@common/document-control/document-access-log.service';
import { stampPdfWatermark } from '@common/pdf/pdf-watermark.helper';
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
import { SdInvoicePdfService, InvoicePdfLine, ExportInvoicePdfData } from '../invoices/sd-invoice-pdf.service';
import {
  CreateInvoiceDtoSchema,
  GetInvoicesDtoSchema,
} from './dto/sd-invoice.dto';

const Role = {
  FINANCE_MANAGER: 'finance_manager',
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  SALES_MANAGER: 'sales_manager',
  // SD-CRM audit §3.2 (2026-07-10): live users seed 'manager', not 'sales_manager'.
  MANAGER: 'manager',
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
    private readonly invoicePdfService: SdInvoicePdfService,
    private readonly accessLog: DocumentAccessLogService,
  ) {}

  // STEP 3.7 — client-export leak prevention: stamp the exporter identity onto the real PDF and
  // record a `client_export` row in document_access_log (the director audit panel reads this).
  // Dual-log: the existing audit_logs entry (AuditInterceptor) is left untouched.
  private async watermarkAndLog(
    buffer: Buffer, req: FastifyRequest, user: AuthenticatedUser, invoiceId: string, kind: string,
  ): Promise<Buffer> {
    const u = (user ?? {}) as { fullName?: string; full_name?: string; username?: string; id?: number };
    const who = u.fullName ?? u.full_name ?? u.username ?? `#${u.id ?? ''}`;
    const stamped = await stampPdfWatermark(buffer, `EuroPrint • ${kind} • ${who}`);
    await this.accessLog.logFromReq(req, { documentType: 'sd_invoice', documentId: invoiceId, action: 'client_export' });
    return stamped;
  }

  @ApiOperation({ summary: 'Get invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.MANAGER)
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
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.MANAGER)
  async getInvoice(@Param('id') id: string) {

      const query = new GetInvoiceQuery(id);
      const result = await this.queryBus.execute(query);

      assertOk(result);
      return (result).data;

  }

  @ApiOperation({ summary: 'Hisob-faktura PDF' })
  @ApiResponse({ status: 200, description: 'PDF fayl' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/pdf')
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.MANAGER)
  async downloadInvoicePdf(@Param('id') id: string, @Res() res: FastifyReply, @Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
    const query = new GetInvoiceQuery(id);
    const result = await this.queryBus.execute(query);
    assertOk(result);
    const inv = result.data as Record<string, unknown>;

    const pdfR = await this.invoicePdfService.generateInvoicePdf({
      invoiceNumber: String(inv.invoice_number ?? id),
      customerName:  String(inv.customer_name ?? ''),
      status:        String(inv.status ?? 'draft'),
      createdAt:     (inv.created_at as string | null) ?? null,
      dueDate:       (inv.due_date as string | null) ?? null,
      subtotal:      Number(inv.subtotal ?? 0),
      taxAmount:     Number(inv.tax_amount ?? 0),
      totalAmount:   Number(inv.total_amount ?? 0),
      paidAmount:    Number(inv.paid_amount ?? 0),
      notes:         (inv.notes as string | null) ?? null,
      lines:         this.parseInvoiceItems(inv.items),
    });

    if (!pdfR.ok) {
      this.logger.error(`Invoice PDF generatsiya xatoligi (id=${id}): ${pdfR.error.message}`);
      throw new InternalServerErrorException(pdfR.error.message);
    }
    const buffer = await this.watermarkAndLog(pdfR.data, req, user, id, 'INVOYS');
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }

  @ApiOperation({ summary: 'Eksport-invoys PDF (Incoterms)' })
  @ApiResponse({ status: 200, description: 'PDF fayl' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/export-pdf')
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER, Role.MANAGER)
  async downloadExportInvoicePdf(@Param('id') id: string, @Res() res: FastifyReply, @Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
    const query = new GetInvoiceQuery(id);
    const result = await this.queryBus.execute(query);
    assertOk(result);
    const inv = result.data as Record<string, unknown>;

    const pdfData: ExportInvoicePdfData = {
      invoiceNumber: String(inv.invoice_number ?? id),
      customerName:  String(inv.customer_name ?? ''),
      status:        String(inv.status ?? 'draft'),
      createdAt:     (inv.created_at as string | null) ?? null,
      dueDate:       (inv.due_date as string | null) ?? null,
      subtotal:      Number(inv.subtotal ?? 0),
      taxAmount:     Number(inv.tax_amount ?? 0),
      totalAmount:   Number(inv.total_amount ?? 0),
      paidAmount:    Number(inv.paid_amount ?? 0),
      notes:         (inv.notes as string | null) ?? null,
      lines:         this.parseInvoiceItems(inv.items),
      // EGASI-DATA fabrikatsiya qilinmagan (Q-40) — DB'da yo'q bo'lsa null,
      // PDF blok "—" ko'rsatadi (bo'sh maydon, gate emas).
      deliveryTerm:  (inv.delivery_term as string | null) ?? null,
      incotermCode:  (inv.incoterm_code as string | null) ?? null,
      currency:      (inv.currency as string | null) ?? null,
    };

    const pdfR = await this.invoicePdfService.generateExportInvoicePdf(pdfData);

    if (!pdfR.ok) {
      this.logger.error(`Eksport-invoys PDF generatsiya xatoligi (id=${id}): ${pdfR.error.message}`);
      throw new InternalServerErrorException(pdfR.error.message);
    }
    const buffer = await this.watermarkAndLog(pdfR.data, req, user, id, 'EKSPORT-INVOYS');
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="export-invoice-${id}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }

  /** `invoices.items` — JSON-serialized text column; graceful parse (Q-46, no crash). */
  private parseInvoiceItems(raw: unknown): InvoicePdfLine[] {
    if (typeof raw !== 'string' || !raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((it) => {
        const item = it as Record<string, unknown>;
        return {
          name:      String(item.name ?? '—'),
          quantity:  Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          taxRate:   Number(item.taxRate ?? 0),
        };
      });
    } catch {
      return [];
    }
  }

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.SALES_MANAGER, Role.MANAGER)
  async createInvoice(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

      const parsed = CreateInvoiceDtoSchema.parse(body);
      const cmd = new CreateInvoiceCommand(
        parsed.salesOrderId,
        parsed.customerName,
        parsed.items as import('../application/commands/create-invoice.command').InvoiceItem[],
        new Date(parsed.dueDate),
        parsed.notes || null,
        String(user.id),
        parsed.deliveryTerm || null,
        parsed.incotermCode || null,
        parsed.currency || null,
      );

      const result = await this.commandBus.execute(cmd);

      assertOk(result);
      this.logger.log('Invoice created successfully');
      return (result).data;
    
  }
}
