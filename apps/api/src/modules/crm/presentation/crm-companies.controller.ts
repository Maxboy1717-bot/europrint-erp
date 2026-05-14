/**
 * @module crm-companies.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { safeInt } from '../../hr/common/db-rows';
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards,
  UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmCompaniesService } from '../application/crm-companies.service';
import {
  CheckCompanyDuplicatesDtoSchema, CheckCompanyDuplicatesDto,
  CreateCompanyDtoSchema, CreateCompanyDto,
  UpdateCreditLimitDtoSchema, UpdateCreditLimitDto,
  CreateLeadStageDtoSchema, CreateLeadStageDto,
  UpdateLeadStageDtoSchema, UpdateLeadStageDto,
} from './dto/crm-companies.dto';

const CRM_WRITE_ROLES = ['sales_manager', 'super_admin', 'director', 'crm_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmCompaniesController {
  private readonly logger = new Logger(CrmCompaniesController.name);

  constructor(private readonly svc: CrmCompaniesService) {}

  @Get('companies')
  async listCompanies(@Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listCompanies(search, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    const _rGetCompany = await this.svc.getCompany(safeInt(id, 0));
    assertOk(_rGetCompany);
    const r = _rGetCompany.data as Record<string, unknown>;
    assertFound(r, 'Company not found');
    return r;
  }

  @Get('companies/:companyId/contacts/:contactId')
  async getCompanyContact(@Param('companyId') companyId: string, @Param('contactId') contactId: string) {
    const r = await this.svc.getCompanyContacts(safeInt(companyId, 0));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    const contact = (Array.isArray(items) ? items : []).find((c: Record<string, unknown>) => String(c['id']) === contactId);
    assertFound(contact, 'Contact not found');
    return contact;
  }

  @Get('companies/:id/contacts')
  async getCompanyContacts(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getCompanyContacts(safeInt(id, 0)));
  }

  @Get('companies/:id/deals')
  async getCompanyDeals(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getCompanyDeals(safeInt(id, 0)));
  }

  @Get('companies/:id/credit')
  async getCompanyCredit(@Param('id') id: string) {
    const _rGetCompanyCredit = await this.svc.getCompanyCredit(safeInt(id, 0));
    assertOk(_rGetCompanyCredit);
    const r = _rGetCompanyCredit.data as Record<string, unknown>;
    assertFound(r, 'Company not found');
    return r;
  }

  @Post('companies/check-duplicates')
  @UsePipes(new ZodValidationPipe(CheckCompanyDuplicatesDtoSchema))
  async checkCompanyDuplicates(@Body() body: CheckCompanyDuplicatesDto) {
    return { duplicates: await this.svc.checkDuplicates(body.name, body.inn) };
  }

  @Post('companies')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCompanyDtoSchema))
  async createCompany(@Body() body: CreateCompanyDto) {
    assertRequired(body.name, 'name required');
    return unwrapOrThrow(await this.svc.createCompany(body));
  }

  @Patch('companies/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCompanyDtoSchema))
  async updateCompany(@Param('id') id: string, @Body() body: CreateCompanyDto) {
    const _rUpdateCompany = await this.svc.updateCompany(safeInt(id, 0), body);
    assertOk(_rUpdateCompany);
    const r = _rUpdateCompany.data as Record<string, unknown>;
    assertFound(r, 'Company not found');
    return r;
  }

  @Delete('companies/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async deleteCompany(@Param('id') id: string) {
    await this.svc.deleteCompany(safeInt(id, 0));
    return {};
  }

  @Patch('companies/:id/credit-limit')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'director', 'FINANCE_MANAGER', 'CFO')
  @UsePipes(new ZodValidationPipe(UpdateCreditLimitDtoSchema))
  async updateCreditLimit(@Param('id') id: string, @Body() body: UpdateCreditLimitDto) {
    const _rUpdateCreditLimit = await this.svc.updateCreditLimit(safeInt(id, 0), body.credit_limit ?? 0);
    assertOk(_rUpdateCreditLimit);
    const r = _rUpdateCreditLimit.data as Record<string, unknown>;
    assertFound(r, 'Company not found');
    return r;
  }

  @Get('lead-stages')
  async listLeadStages() {
    return unwrapOrThrow(await this.svc.listLeadStages());
  }

  @Get('lead-stages/:id')
  async getLeadStage(@Param('id') id: string) {
    const _rGetLeadStage = await this.svc.getLeadStage(safeInt(id, 0));
    assertOk(_rGetLeadStage);
    const r = _rGetLeadStage.data as Record<string, unknown>;
    assertFound(r, 'Lead stage not found');
    return r;
  }

  @Post('lead-stages')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateLeadStageDtoSchema))
  async createLeadStage(@Body() body: CreateLeadStageDto) {
    assertRequired(body.name, 'name required');
    return unwrapOrThrow(await this.svc.createLeadStage(body.name, body.color, body.sort_order));
  }

  @Patch('lead-stages/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateLeadStageDtoSchema))
  async updateLeadStage(@Param('id') id: string, @Body() body: UpdateLeadStageDto) {
    const _rUpdateLeadStage = await this.svc.updateLeadStage(safeInt(id, 0), body);
    assertOk(_rUpdateLeadStage);
    const r = _rUpdateLeadStage.data as Record<string, unknown>;
    assertFound(r, 'Lead stage not found');
    return r;
  }

  @Post('companies/:id/contacts')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async createCompanyContact(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.svc.createCompanyContact(safeInt(id, 0), body));
  }

  @Delete('companies/:id/contacts/:contactId')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async deleteCompanyContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    await this.svc.deleteCompanyContact(safeInt(id, 0), safeInt(contactId, 0));
    return { deleted: true };
  }
}
