/**
 * @module crm-companies.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { safeInt } from '@common/db/db-rows';

const CreateCompanyContactSchema = z.object({
  name: z.string().min(1).max(200),
  position: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards,
  UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Crm Companies')
@ApiBearerAuth()
@Controller('crm')
export class CrmCompaniesController {
  private readonly logger = new Logger(CrmCompaniesController.name);

  constructor(private readonly svc: CrmCompaniesService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List companies' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('companies')
  async listCompanies(@Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listCompanies(search, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Get company' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    const _rGetCompany = await this.svc.getCompany(safeInt(id, 0));
    assertOk(_rGetCompany);
    const r = _rGetCompany.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.companyNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Get company contact' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('companies/:companyId/contacts/:contactId')
  async getCompanyContact(@Param('companyId') companyId: string, @Param('contactId') contactId: string) {
    const r = await this.svc.getCompanyContacts(safeInt(companyId, 0));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    const contact = (Array.isArray(items) ? items : []).find((c: Record<string, unknown>) => String(c['id']) === contactId);
    assertFound(contact, await this.i18n.t('errors.contactNotFound'));
    return contact;
  }

  @ApiOperation({ summary: 'Get company contacts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('companies/:id/contacts')
  async getCompanyContacts(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getCompanyContacts(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Get company deals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('companies/:id/deals')
  async getCompanyDeals(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getCompanyDeals(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Get company credit' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('companies/:id/credit')
  async getCompanyCredit(@Param('id') id: string) {
    const _rGetCompanyCredit = await this.svc.getCompanyCredit(safeInt(id, 0));
    assertOk(_rGetCompanyCredit);
    const r = _rGetCompanyCredit.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.companyNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Check company duplicates' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('companies/check-duplicates')
  @UsePipes(new ZodValidationPipe(CheckCompanyDuplicatesDtoSchema))
  async checkCompanyDuplicates(@Body() body: CheckCompanyDuplicatesDto) {
    return { duplicates: await this.svc.checkDuplicates(body.name, body.inn) };
  }

  @ApiOperation({ summary: 'Create company' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('companies')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCompanyDtoSchema))
  async createCompany(@Body() body: CreateCompanyDto) {
    assertRequired(body.name, await this.i18n.t('validation.nameRequired'));
    return unwrapOrThrow(await this.svc.createCompany(body));
  }

  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('companies/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCompanyDtoSchema))
  async updateCompany(@Param('id') id: string, @Body() body: CreateCompanyDto) {
    const _rUpdateCompany = await this.svc.updateCompany(safeInt(id, 0), body);
    assertOk(_rUpdateCompany);
    const r = _rUpdateCompany.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.companyNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('companies/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async deleteCompany(@Param('id') id: string) {
    await this.svc.deleteCompany(safeInt(id, 0));
    return {};
  }

  @ApiOperation({ summary: 'Update credit limit' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('companies/:id/credit-limit')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'director', 'FINANCE_MANAGER', 'CFO')
  @UsePipes(new ZodValidationPipe(UpdateCreditLimitDtoSchema))
  async updateCreditLimit(@Param('id') id: string, @Body() body: UpdateCreditLimitDto) {
    const _rUpdateCreditLimit = await this.svc.updateCreditLimit(safeInt(id, 0), body.credit_limit ?? 0);
    assertOk(_rUpdateCreditLimit);
    const r = _rUpdateCreditLimit.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.companyNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'List lead stages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('lead-stages')
  async listLeadStages() {
    return unwrapOrThrow(await this.svc.listLeadStages());
  }

  @ApiOperation({ summary: 'Get lead stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('lead-stages/:id')
  async getLeadStage(@Param('id') id: string) {
    const _rGetLeadStage = await this.svc.getLeadStage(safeInt(id, 0));
    assertOk(_rGetLeadStage);
    const r = _rGetLeadStage.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.leadStageNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Create lead stage' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('lead-stages')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateLeadStageDtoSchema))
  async createLeadStage(@Body() body: CreateLeadStageDto) {
    assertRequired(body.name, await this.i18n.t('validation.nameRequired'));
    return unwrapOrThrow(await this.svc.createLeadStage(body.name, body.color, body.sort_order));
  }

  @ApiOperation({ summary: 'Update lead stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('lead-stages/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateLeadStageDtoSchema))
  async updateLeadStage(@Param('id') id: string, @Body() body: UpdateLeadStageDto) {
    const _rUpdateLeadStage = await this.svc.updateLeadStage(safeInt(id, 0), body);
    assertOk(_rUpdateLeadStage);
    const r = _rUpdateLeadStage.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.leadStageNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Create company contact' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('companies/:id/contacts')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async createCompanyContact(@Param('id') id: string, @Body() body: unknown) {
    const dto = CreateCompanyContactSchema.parse(body);
    return unwrapOrThrow(await this.svc.createCompanyContact(safeInt(id, 0), dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Delete company contact' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('companies/:id/contacts/:contactId')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async deleteCompanyContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    await this.svc.deleteCompanyContact(safeInt(id, 0), safeInt(contactId, 0));
    return { deleted: true };
  }
}
