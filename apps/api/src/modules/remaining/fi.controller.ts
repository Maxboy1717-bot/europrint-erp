/**
 * @module fi.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { FiService } from './fi.service';
import { CostCenterDto, GlDocumentDto, ProfitCenterDto } from '../compatibility/dto/finance.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import {
  CostCenterAclTranslator,
  type LegacyCostCenterRow,
  type CostCenterDto as CostCenterAclDto,
} from './acl/cost-center-acl';
import {
  FiInvoiceAclTranslator,
  type LegacyFiInvoiceRow,
  type FiInvoiceDto,
} from './acl/fi-invoice-acl';

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('legacy/fi')
export class FiController {
  /** PA2-14 ACL demonstrators. Stateless — direct instantiation is fine. */
  private readonly costCenterAcl = new CostCenterAclTranslator();
  private readonly invoiceAcl = new FiInvoiceAclTranslator();

  constructor(private readonly svc: FiService) {}

  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  @Get('recent-transactions')
  async getRecentTransactions() {
    return unwrapOrInternal(await this.svc.getRecentTransactions());
  }

  @Get('cost-centers')
  async getCostCenters() {
    return unwrapOrInternal(await this.svc.getCostCenters());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-7 consumers should target `/v2`;
   * the legacy `cost-centers` endpoint stays for backwards-compat.
   */
  @Get('cost-centers/v2')
  async getCostCentersV2(): Promise<CostCenterAclDto[]> {
    const rows = unwrapOrInternal(await this.svc.getCostCenters()) as unknown as LegacyCostCenterRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.costCenterAcl.toDomain(row))
      .filter((r): r is { ok: true; data: CostCenterAclDto } => r.ok)
      .map((r) => r.data);
  }

  @Get('cost-centers/:id')
  async getCostCenter(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getCostCenter(id));
  }

  @Post('cost-centers')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  async createCostCenter(@Body() body: CostCenterDto) {
    return unwrapOrInternal(await this.svc.createCostCenter(body));
  }

  @Patch('cost-centers/:id')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  async updateCostCenter(@Param('id') id: string, @Body() body: CostCenterDto) {
    return unwrapOrInternal(await this.svc.updateCostCenter(id, body));
  }

  @Delete('cost-centers/:id')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  async deleteCostCenter(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteCostCenter(id));
  }

  @Get('profit-centers')
  async getProfitCenters() {
    return unwrapOrInternal(await this.svc.getProfitCenters());
  }

  @Get('profit-centers/:id')
  async getProfitCenter(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getProfitCenter(id));
  }

  @Post('profit-centers')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  async createProfitCenter(@Body() body: CostCenterDto) {
    return unwrapOrInternal(await this.svc.createProfitCenter(body));
  }

  @Patch('profit-centers/:id')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  async updateProfitCenter(@Param('id') id: string, @Body() body: CostCenterDto) {
    return unwrapOrInternal(await this.svc.updateProfitCenter(id, body));
  }

  @Delete('profit-centers/:id')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  async deleteProfitCenter(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteProfitCenter(id));
  }

  @Get('gl-documents')
  async getGlDocuments() {
    return unwrapOrInternal(await this.svc.getGlDocuments());
  }

  @Post('gl-documents')
  @UseGuards(RolesGuard)
  @Roles('finance_manager', 'accountant', 'cfo', 'admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  async createGlDocument(@Body() body: CostCenterDto) {
    return unwrapOrInternal(await this.svc.createGlDocument(body));
  }

  @Get('gl-entries')
  async getGlEntries(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getGlEntries(Number(page ?? 1), Number(limit ?? 20)));
  }

  @Get('invoices')
  async getInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getInvoices(Number(page ?? 1), Number(limit ?? 20)));
  }

  /**
   * PA2-14 ACL-translated variant of `invoices`. New BC-7 consumers
   * should target `/v2`; the legacy endpoint stays for backwards-compat.
   *
   * The legacy service wraps the rows in `{ data, pagination }`; this
   * endpoint preserves the envelope while translating only the data array.
   */
  @Get('invoices/v2')
  async getInvoicesV2(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: FiInvoiceDto[]; pagination: { total: number; page: number; limit: number } }> {
    const p = Number(page ?? 1);
    const l = Number(limit ?? 20);
    const wrapped = unwrapOrInternal(await this.svc.getInvoices(p, l)) as unknown as {
      data: LegacyFiInvoiceRow[];
      pagination: { total: number; page: number; limit: number };
    };
    const list = Array.isArray(wrapped?.data) ? wrapped.data : [];
    const data = list
      .map((row) => this.invoiceAcl.toDomain(row))
      .filter((r): r is { ok: true; data: FiInvoiceDto } => r.ok)
      .map((r) => r.data);
    const pagination = wrapped?.pagination ?? { total: data.length, page: p, limit: l };
    return { data, pagination };
  }
}
