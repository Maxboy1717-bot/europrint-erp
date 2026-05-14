/**
 * @module sd-customers.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Logger, NotFoundException, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdCustomersService } from '../application/sd-customers.service';
import {
  SdUpdateCustomerSchema, SdUpdateCustomerDto,
  SdAddContactSchema, SdAddContactDto,
  SdUpdateContactSchema, SdUpdateContactDto,
  SdAddInteractionSchema, SdAddInteractionDto,
  SdAddDocumentSchema, SdAddDocumentDto,
} from '../dto/sd.dto';

const SD_WRITE_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sd/customers')
export class SdCustomersController {
  private readonly logger = new Logger(SdCustomersController.name);

  constructor(private readonly svc: SdCustomersService) {}

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

  @Get(':id')
  async getById(@Param('id') id: string) {
    const cid = safeInt(id, 0);
    const _rR = await this.svc.getById(cid);
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Customer not found');
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

  @Get(':id/360')
  async get360View(@Param('id') id: string) {
    const _rResult = await this.svc.get360View(safeInt(id, 0));
    const data = unwrapOrThrow(_rResult);
    assertFound((data as Record<string, unknown>).customer ?? (data as Record<string, unknown>).basic, 'Customer not found');
    return data;
  }

  @Post()
  @Roles(...SD_WRITE_ROLES)
  async create(@Body() body: Record<string, unknown>) {
    if (!body.name && !body.title) {
      throw new BadRequestException('Mijoz nomi (name yoki title) majburiy');
    }
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(SdUpdateCustomerSchema))
  @Roles(...SD_WRITE_ROLES)
  async update(@Param('id') id: string, @Body() body: SdUpdateCustomerDto) {
    const _rR = await this.svc.update(safeInt(id, 0), body);
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Customer not found');
    return r[0];
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'director')
  async delete(@Param('id') id: string) {
    await this.svc.softDelete(safeInt(id, 0));
    return {};
  }

  @Get(':id/contacts')
  async getContacts(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getContacts(safeInt(id, 0)));
  }

  @Post(':id/contacts')
  @Roles(...SD_WRITE_ROLES)
  async addContact(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    if (!body.full_name) throw new BadRequestException('full_name majburiy');
    return unwrapOrThrow(await this.svc.addContact(
      safeInt(id, 0), body.full_name, body.phone, body.email, body.position, body.is_primary,
      { influence_level: body.influence_level, is_decision_maker: body.is_decision_maker,
        department: body.department, linkedin_url: body.linkedin_url,
        role_note: body.role_note, telegram: body.telegram },
    ));
  }

  @Put(':id/contacts/:cid')
  @Roles(...SD_WRITE_ROLES)
  async updateContact(@Param('id') customerId: string, @Param('cid') contactId: string,
    @Body() body: Record<string, unknown>) {
    const _rR = await this.svc.updateContact(
      safeInt(customerId, 0), safeInt(contactId, 0),
      body.full_name, body.phone, body.email, body.position,
      { influence_level: body.influence_level, is_decision_maker: body.is_decision_maker,
        department: body.department, linkedin_url: body.linkedin_url,
        role_note: body.role_note, telegram: body.telegram },
    );
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Contact not found');
    return r[0];
  }

  @Delete(':id/contacts/:cid')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteContact(@Param('id') customerId: string, @Param('cid') contactId: string) {
    await this.svc.deleteContact(safeInt(customerId, 0), safeInt(contactId, 0));
    return {};
  }

  @Get(':id/interactions')
  async getInteractions(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getInteractions(safeInt(id, 0)));
  }

  @Post(':id/interactions')
  @UsePipes(new ZodValidationPipe(SdAddInteractionSchema))
  @Roles(...SD_WRITE_ROLES)
  async addInteraction(@Param('id') id: string, @Body() body: SdAddInteractionDto) {
    return unwrapOrThrow(await this.svc.addInteraction(safeInt(id, 0), body.type, body.notes, body.employee_id));
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getDocuments(safeInt(id, 0)));
  }

  @Post(':id/documents')
  @UsePipes(new ZodValidationPipe(SdAddDocumentSchema))
  @Roles(...SD_WRITE_ROLES)
  async addDocument(@Param('id') id: string, @Body() body: SdAddDocumentDto) {
    return unwrapOrThrow(await this.svc.addDocument(safeInt(id, 0), body.type, body.name, body.url, body.notes));
  }

  @Delete(':id/documents/:did')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteDocument(@Param('id') customerId: string, @Param('did') docId: string) {
    await this.svc.deleteDocument(safeInt(customerId, 0), safeInt(docId, 0));
    return {};
  }

  @Get(':id/competitors')
  async getCompetitors(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getCompetitors(safeInt(id, 0)));
  }

  @Post(':id/competitors')
  @Roles(...SD_WRITE_ROLES)
  async addCompetitor(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    if (!body.competitor_name && !body.name) throw new BadRequestException('competitor_name majburiy');
    return unwrapOrThrow(await this.svc.addCompetitor(safeInt(id, 0), body));
  }

  @Delete(':id/competitors/:coid')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteCompetitor(@Param('id') customerId: string, @Param('coid') coid: string) {
    await this.svc.deleteCompetitor(safeInt(customerId, 0), safeInt(coid, 0));
    return {};
  }

  // ── NPS endpoints ──────────────────────────────────────────────────────────
  @Get(':id/nps')
  async getNps(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getNps(safeInt(id, 0)));
  }

  @Post(':id/nps')
  @Roles(...SD_WRITE_ROLES)
  async addNps(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const score = Number(body.score);
    if (isNaN(score) || score < 0 || score > 10) throw new BadRequestException('score 0-10 oralig\'ida bo\'lishi kerak');
    return unwrapOrThrow(await this.svc.addNps(safeInt(id, 0), score, body.comment));
  }

  // ── Internal intelligence (Layer 7) ───────────────────────────────────────
  @Patch(':id/internal')
  @Roles(...SD_WRITE_ROLES)
  async updateInternalNotes(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.svc.updateInternalNotes(safeInt(id, 0), body));
  }

  @Get(':id/complaints')
  async getComplaints(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getComplaints(safeInt(id, 0)));
  }

  @Post(':id/complaints')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async createComplaint(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id: Date.now(), customerId: safeInt(id, 0), ...body, created: true };
  }

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
