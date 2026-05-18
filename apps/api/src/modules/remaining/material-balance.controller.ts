/**
 * @module material-balance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards , UseInterceptors} from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MaterialBalanceService } from './material-balance.service';
import { MaterialBalanceBodyDto } from '../compatibility/dto/operations.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { notImplemented } from '@common/exceptions/not-implemented';
import {
  MaterialBalanceOverviewAclTranslator,
  type LegacyMaterialBalanceOverviewRow,
  type MaterialBalanceOverviewDto,
} from './acl/material-balance-overview-acl';

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('material-balance')
export class MaterialBalanceController {
  /** PA2-14 ACL demonstrator. Stateless - direct instantiation is fine. */
  private readonly overviewAcl = new MaterialBalanceOverviewAclTranslator();

  constructor(private readonly svc: MaterialBalanceService) {}

  @Get('overview')
  async getOverview() {
    return unwrapOrInternal(await this.svc.getOverview());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-5 (Warehouse / WMS) consumers
   * should target this endpoint; the legacy `/overview` route stays for
   * backwards-compat.
   */
  @Get('overview/v2')
  async getOverviewV2(): Promise<MaterialBalanceOverviewDto | null> {
    const raw = unwrapOrInternal(await this.svc.getOverview()) as unknown as LegacyMaterialBalanceOverviewRow;
    const r = this.overviewAcl.toDomain(raw);
    return r.ok ? r.data : null;
  }

  @Get('alerts')
  async getAlerts() {
    return unwrapOrInternal(await this.svc.getAlerts());
  }

  @Get('internal-requests')
  async getInternalRequests() {
    return unwrapOrInternal(await this.svc.getInternalRequests());
  }

  @Patch('internal-requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'director', 'warehouse_manager', 'manager')
  async approveRequest(
    @Param('id') id: string,
    @Body() body: MaterialBalanceBodyDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.approveRequest(id, body, user.id));
  }

  @Patch('internal-requests/:id/issue')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'director', 'warehouse_manager', 'manager')
  async issueRequest(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.issueRequest(id));
  }

  @Get('production')
  async getProduction(@Query() _q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getProduction());
  }

  @Post('production/take')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async takeMaterial(@Body() body: MaterialBalanceBodyDto) {
    return unwrapOrInternal(await this.svc.takeMaterial(body));
  }

  @Post('production/use')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async useMaterial(@Body() body: MaterialBalanceBodyDto) {
    return unwrapOrInternal(await this.svc.useMaterial(body));
  }

  @Post('production/return')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async returnMaterial(@Body() body: MaterialBalanceBodyDto) {
    return unwrapOrInternal(await this.svc.returnMaterial(body));
  }

  @Post('negative-stock-check')
  async negativeStockCheck() {
    return unwrapOrInternal(await this.svc.negativeStockCheck());
  }

  @Get(':materialId/history')
  async getHistory(@Param('materialId') materialId: string, @Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getHistory(materialId, q));
  }

  /**
   * MaterialBalance page calls GET /api/material-balance/movements as a
   * cross-material movement feed. Real implementation will join material
   * movements across all materials.
   *
   * P3-26: returns 501 until the aggregator is wired; clients can fall back to
   * /api/material-balance/:materialId/history per-material.
   */
  @Get('movements')
  async getMovements(@Query() _q: Record<string, string>) {
    return notImplemented('GET /material-balance/movements');
  }

  @Get(':materialId/reconciliation')
  async getReconciliation(@Param('materialId') materialId: string) {
    return unwrapOrInternal(await this.svc.getReconciliation(materialId));
  }

  @Get('warehouse/:warehouseId')
  async getByWarehouse(@Param('warehouseId') warehouseId: string) {
    return unwrapOrInternal(await this.svc.getByWarehouse(warehouseId));
  }
}
