import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Logger, NotFoundException, Param, Post, Put, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
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
@Controller('sd/customers')
export class SdCustomersController {
  private readonly logger = new Logger(SdCustomersController.name);

  constructor(private readonly svc: SdCustomersService) {}

  @Get()
  async list(@Query('search') search?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.list(search, status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const _rR = await this.svc.getById(safeInt(id, 0));
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Customer not found');
    return r[0];
  }

  @Get(':id/360')
  async get360View(@Param('id') id: string) {
    const _rResult = await this.svc.get360View(safeInt(id, 0));
    const data = unwrapOrThrow(_rResult);
    assertFound(data.customer, 'Customer not found');
    return data;
  }

  @Post()
  @Roles(...SD_WRITE_ROLES)
  async create() {
    throw new ForbiddenException(
      'Mijoz yaratish §8.8 qoidasi bo\'yicha CRM moduliga tegishli. ' +
      'Yangi mijoz yaratish uchun POST /crm/contacts dan foydalaning va ' +
      'olingan customerId ni SD sohasida reference qiling.',
    );
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
  @UsePipes(new ZodValidationPipe(SdAddContactSchema))
  @Roles(...SD_WRITE_ROLES)
  async addContact(@Param('id') id: string, @Body() body: SdAddContactDto) {
    return unwrapOrThrow(await this.svc.addContact(safeInt(id, 0), body.full_name, body.phone, body.email, body.position, body.is_primary));
  }

  @Put(':id/contacts/:cid')
  @UsePipes(new ZodValidationPipe(SdUpdateContactSchema))
  @Roles(...SD_WRITE_ROLES)
  async updateContact(@Param('id') customerId: string, @Param('cid') contactId: string,
    @Body() body: SdUpdateContactDto) {
    const _rR = await this.svc.updateContact(safeInt(customerId, 0), safeInt(contactId, 0),
      body.full_name, body.phone, body.email, body.position);
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

  @Delete(':id/competitors/:coid')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async deleteCompetitor(@Param('id') customerId: string, @Param('coid') coid: string) {
    await this.svc.deleteCompetitor(safeInt(customerId, 0), safeInt(coid, 0));
    return {};
  }

  @Get(':id/complaints')
  async getComplaints(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getComplaints(safeInt(id, 0)));
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
