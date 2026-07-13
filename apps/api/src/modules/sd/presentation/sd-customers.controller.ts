/**
 * @module sd-customers.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, Res, StreamableFile, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Readable } from 'stream';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';

const CreateCustomerSchema = z.object({
  name: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  inn: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(2000).optional(),
  // CRM-13 #120: customer's usual settlement method — same vocabulary as
  // SdCreatePaymentSchema.payment_method (sd.dto.ts) / sd_payments.payment_method.
  default_payment_type: z.enum(['cash', 'card', 'bank_transfer', 'online']).optional(),
  // CRM-13 #133 — agreed packaging method (free text; runtime-entered, no fixed vocabulary in vision)
  packaging_method: z.string().max(500).optional(),
}).passthrough();

const AddContactSchema = z.object({
  full_name: z.string().max(200),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  is_primary: z.boolean().optional(),
  influence_level: z.string().max(50).optional(),
  is_decision_maker: z.boolean().optional(),
  department: z.string().max(200).optional(),
  linkedin_url: z.string().max(500).optional(),
  role_note: z.string().max(2000).optional(),
  telegram: z.string().max(200).optional(),
}).passthrough();

const UpdateContactBodySchema = z.object({
  full_name: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  influence_level: z.string().max(50).optional(),
  is_decision_maker: z.boolean().optional(),
  department: z.string().max(200).optional(),
  linkedin_url: z.string().max(500).optional(),
  role_note: z.string().max(2000).optional(),
  telegram: z.string().max(200).optional(),
}).passthrough();

const AddCompetitorSchema = z.object({
  competitor_name: z.string().max(500).optional(),
  name: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const AddNpsSchema = z.object({
  score: z.number().min(0).max(10),
  comment: z.string().max(2000).optional(),
}).passthrough();

const UpdateInternalNotesSchema = z.object({
  // Declares exactly what the repo (updateInternalNotes) reads and the FE (Customer360View)
  // sends: relationship_quality, internal_notes (-> the `notes` column), share_of_wallet.
  // risk_level/internal_classification had no column (dropped); the earlier trim left `notes`,
  // but the repo reads body.internal_notes (NOT body.notes) so `notes` was itself a phantom.
  // No passthrough: the advertised contract now matches what actually saves.
  relationship_quality: z.string().max(100).optional(),
  internal_notes: z.string().max(5000).optional(),
  share_of_wallet: z.number().nonnegative().optional(),
});

const CreateComplaintSchema = z.object({
  subject: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  severity: z.string().max(50).optional(),
}).passthrough();
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdCustomersService } from '../application/sd-customers.service';
import { CustomerAbcService } from '../application/customer-abc.service';
import {
  SdUpdateCustomerSchema, SdUpdateCustomerDto,
  SdAddContactSchema, SdAddContactDto,
  SdUpdateContactSchema, SdUpdateContactDto,
  SdAddInteractionSchema, SdAddInteractionDto,
  SdAddDocumentSchema, SdAddDocumentDto,
} from '../dto/sd.dto';

const SD_WRITE_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Sd Customers')
@ApiBearerAuth()
@Controller('sd/customers')
export class SdCustomersController {
  private readonly logger = new Logger(SdCustomersController.name);

  constructor(
    private readonly svc: SdCustomersService,
    private readonly abc: CustomerAbcService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'ABC segment preview (compute, no persist) (EP-SD master-data)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('abc/preview')
  @Roles(...SD_WRITE_ROLES)
  async abcPreview() {
    return unwrapOrThrow(await this.abc.preview());
  }

  @ApiOperation({ summary: 'ABC segment recompute + persist (annual purchase Pareto)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('abc/recompute')
  @Roles(...SD_WRITE_ROLES)
  async abcRecompute() {
    return unwrapOrThrow(await this.abc.recompute());
  }

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('search') search?: string, @Query('status') status?: string,
    @Query('segment') segment?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string) {
    // Support both 'status' and 'segment' filters (frontend sends 'segment')
    const filter = segment || status;
    const rows = unwrapOrThrow(await this.svc.list(search, filter, safeInt(limit, 50), safeInt(offset, 0)));
    // Return as { data: [...] } for frontend compatibility (also handles plain array)
    const arr = Array.isArray(rows) ? rows : [];
    return { data: arr, total: arr.length };
  }

  @ApiOperation({ summary: 'Export customers as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  @Get('export')
  @Roles('super_admin', 'director', 'sales_manager')
  async exportCustomers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Res({ passthrough: true }) res?: FastifyReply,
  ): Promise<StreamableFile> {
    const result = await this.svc.exportCsv(search, status);
    if (!result.ok) throw new HttpException(await this.i18n.t('errors.customerExportFailed'), HttpStatus.INTERNAL_SERVER_ERROR);
    void res!.header('Content-Type', 'text/csv; charset=utf-8')
              .header('Content-Disposition', 'attachment; filename="customers.csv"');
    return new StreamableFile(Readable.from(Buffer.from(result.data as string, 'utf-8')));
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const cid = safeInt(id, 0);
    const _rR = await this.svc.getById(cid);
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.customerNotFound'));
    const customer = r[0];
    // Enrich with contacts and recent orders in parallel
    const [contactsResult, ordersResult] = await Promise.all([
      this.svc.getContacts(cid).catch(() => null),
      this.svc.getRecentOrders(cid).catch(() => null),
    ]);
    const rawContacts = contactsResult ? (unwrapOrThrow(contactsResult) as Record<string, unknown>[]) : [];
    const rawOrders  = ordersResult  ? (unwrapOrThrow(ordersResult)  as Record<string, unknown>[]) : [];
    const contacts = rawContacts.map((c: Record<string, unknown>) => ({
      id:        c.id,
      name:      c.full_name ?? c.name,        // frontend SdContact expects 'name'
      position:  c.position,
      phone:     c.phone,
      email:     c.email,
      isPrimary: Boolean(c.is_primary),
    }));
    const recentOrders = rawOrders.map((o: Record<string, unknown>) => ({
      id:          o.id,
      orderNumber: o.order_number ?? o.orderNumber,
      totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
      status:      o.status,
    }));
    // Derive totals from recentOrders (accurate since limit=10, use list() totalOrders if available)
    const totalOrders  = (customer as Record<string, unknown>).totalOrders  ?? recentOrders.length;
    const totalRevenue = (customer as Record<string, unknown>).totalRevenue ?? recentOrders.reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalAmount ?? 0), 0);
    return { ...customer, contacts, recentOrders, totalOrders, totalRevenue };
  }

  @ApiOperation({ summary: 'Get360 view' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/360')
  async get360View(@Param('id') id: string) {
    const _rResult = await this.svc.get360View(safeInt(id, 0));
    const data = unwrapOrThrow(_rResult);
    assertFound((data as Record<string, unknown>).customer ?? (data as Record<string, unknown>).basic, await this.i18n.t('errors.customerNotFound'));
    return data;
  }

  @ApiOperation({ summary: 'Credit-limit check (EP-SD-060/061/062)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/credit-check')
  async creditCheck(@Param('id') id: string, @Query('amount') amount?: string) {
    return unwrapOrThrow(await this.svc.getCreditStatus(safeInt(id, 0), Number(amount ?? 0)));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(...SD_WRITE_ROLES)
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateCustomerSchema.parse(body);
    if (!dto.name && !dto.title) {
      throw new BadRequestException(await this.i18n.t('errors.customerNameRequired'));
    }
    return unwrapOrThrow(await this.svc.create(dto as Record<string, unknown>, user.id));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @UsePipes(new ZodValidationPipe(SdUpdateCustomerSchema))
  @Roles(...SD_WRITE_ROLES)
  async update(@Param('id') id: string, @Body() body: SdUpdateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    // Ownership gate (owner decision 2026-07-13): svc.update() checks user.id/role
    // against sd_customers.manager_id — see sd-customer-scope.ts.
    const _rR = await this.svc.update(safeInt(id, 0), body, { id: user.id, role: user.role });
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.customerNotFound'));
    return r[0];
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  // LEGACY_NOOP: soft-delete returns 200 with empty body; frontend SdCustomers
  // page does not read the response. P3-26 audit verified service.softDelete()
  // does real work; only the response shape is empty.
  // VISION-3340 #63: now threads the acting user into deleted_by (previously the
  // controller never accepted @CurrentUser(), so deleted_at/deleted_by stayed NULL).
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'director')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.svc.softDelete(safeInt(id, 0), user.id);
    return {};
  }

  @ApiOperation({ summary: 'Get contacts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/contacts')
  async getContacts(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getContacts(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Add contact' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/contacts')
  @Roles(...SD_WRITE_ROLES)
  async addContact(@Param('id') id: string, @Body() body: unknown) {
    const dto = AddContactSchema.parse(body);
    return unwrapOrThrow(await this.svc.addContact(
      safeInt(id, 0), dto.full_name, dto.phone, dto.email, dto.position, dto.is_primary,
      { influence_level: dto.influence_level, is_decision_maker: dto.is_decision_maker,
        department: dto.department, linkedin_url: dto.linkedin_url,
        role_note: dto.role_note, telegram: dto.telegram },
    ));
  }

  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id/contacts/:cid')
  @Roles(...SD_WRITE_ROLES)
  async updateContact(@Param('id') customerId: string, @Param('cid') contactId: string,
    @Body() body: unknown) {
    const dto = UpdateContactBodySchema.parse(body);
    const _rR = await this.svc.updateContact(
      safeInt(customerId, 0), safeInt(contactId, 0),
      dto.full_name, dto.phone, dto.email, dto.position,
      { influence_level: dto.influence_level, is_decision_maker: dto.is_decision_maker,
        department: dto.department, linkedin_url: dto.linkedin_url,
        role_note: dto.role_note, telegram: dto.telegram },
    );
    const r = unwrapOrThrow(_rR);
    assertFound(r, await this.i18n.t('errors.contactNotFound'));
    return r[0];
  }

  @ApiOperation({ summary: 'Delete contact' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id/contacts/:cid')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteContact(@Param('id') customerId: string, @Param('cid') contactId: string) {
    await this.svc.deleteContact(safeInt(customerId, 0), safeInt(contactId, 0));
    return {};
  }

  @ApiOperation({ summary: 'Get interactions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/interactions')
  async getInteractions(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getInteractions(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Add interaction' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/interactions')
  @UsePipes(new ZodValidationPipe(SdAddInteractionSchema))
  @Roles(...SD_WRITE_ROLES)
  async addInteraction(@Param('id') id: string, @Body() body: SdAddInteractionDto) {
    return unwrapOrThrow(await this.svc.addInteraction(safeInt(id, 0), body.type, body.notes, body.employee_id));
  }

  @ApiOperation({ summary: 'Get documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getDocuments(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Add document' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/documents')
  @UsePipes(new ZodValidationPipe(SdAddDocumentSchema))
  @Roles(...SD_WRITE_ROLES)
  async addDocument(@Param('id') id: string, @Body() body: SdAddDocumentDto) {
    return unwrapOrThrow(await this.svc.addDocument(safeInt(id, 0), body.type, body.name, body.url, body.notes));
  }

  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id/documents/:did')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteDocument(@Param('id') customerId: string, @Param('did') docId: string) {
    await this.svc.deleteDocument(safeInt(customerId, 0), safeInt(docId, 0));
    return {};
  }

  @ApiOperation({ summary: 'Get competitors' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/competitors')
  async getCompetitors(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getCompetitors(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Add competitor' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/competitors')
  @Roles(...SD_WRITE_ROLES)
  async addCompetitor(@Param('id') id: string, @Body() body: unknown) {
    const dto = AddCompetitorSchema.parse(body);
    if (!dto.competitor_name && !dto.name) throw new BadRequestException(await this.i18n.t('errors.competitorNameRequired'));
    return unwrapOrThrow(await this.svc.addCompetitor(safeInt(id, 0), dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Delete competitor' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id/competitors/:coid')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteCompetitor(@Param('id') customerId: string, @Param('coid') coid: string) {
    await this.svc.deleteCompetitor(safeInt(customerId, 0), safeInt(coid, 0));
    return {};
  }

  // -- NPS endpoints ----------------------------------------------------------
  @ApiOperation({ summary: 'Get nps' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/nps')
  async getNps(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getNps(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Add nps' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/nps')
  @Roles(...SD_WRITE_ROLES)
  async addNps(@Param('id') id: string, @Body() body: unknown) {
    const dto = AddNpsSchema.parse(body);
    return unwrapOrThrow(await this.svc.addNps(safeInt(id, 0), dto.score, dto.comment));
  }

  // -- Internal intelligence (Layer 7) ---------------------------------------
  @ApiOperation({ summary: 'Update internal notes' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/internal')
  @Roles(...SD_WRITE_ROLES)
  async updateInternalNotes(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateInternalNotesSchema.parse(body);
    return unwrapOrThrow(await this.svc.updateInternalNotes(safeInt(id, 0), dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Get complaints' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/complaints')
  async getComplaints(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getComplaints(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Create complaint' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/complaints')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async createComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = z.object({
      subject: z.string().min(1),
      description: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    }).parse(body);
    const result = await this.svc.createComplaint(id, parsed);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  @ApiOperation({ summary: 'Resolve complaint' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/complaints/:cid/resolve')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async resolveComplaint(
    @Param('id') customerId: string,
    @Param('cid') complaintId: string,
    @Body() body: { resolution: string; resolved_by?: number },
  ) {
    const _rResolveComplaint = await this.svc.resolveComplaint(
      safeInt(customerId, 0),
      safeInt(complaintId, 0),
      body.resolution,
      body.resolved_by ?? null,
    );
    assertOk(_rResolveComplaint);
    return _rResolveComplaint.data;
  }
}
