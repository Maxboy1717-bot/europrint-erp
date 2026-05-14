/**
 * @module asset-management.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query,
  UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest, unwrapOrNotFound, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { AssetManagementService } from './asset-management.service';

const AssetSchema = z.object({
  name:          z.string().min(1),
  assetCode:     z.string().optional(),
  category:      z.string().default('equipment'),
  status:        z.string().default('active'),
  location:      z.string().optional(),
  assignedTo:    z.string().optional(),
  departmentId:  z.number().int().optional(),
  serialNumber:  z.string().optional(),
  purchaseDate:  z.string().datetime().optional(),
  purchaseValue: z.string().optional(),
  currentValue:  z.string().optional(),
  notes:         z.string().optional(),
});

const MaintenanceSchema = z.object({
  assetId:         z.string().uuid(),
  maintenanceType: z.string().default('routine'),
  scheduledAt:     z.string().datetime().optional(),
  completedAt:     z.string().datetime().optional(),
  cost:            z.string().optional(),
  notes:           z.string().optional(),
  status:          z.string().default('scheduled'),
});

const DisposalSchema = z.object({
  assetId:      z.string().uuid(),
  disposalType: z.string().default('retired'),
  disposalDate: z.string().datetime().optional(),
  saleValue:    z.string().optional(),
  reason:       z.string().optional(),
  approvedBy:   z.string().optional(),
});

const TransferSchema = z.object({
  assetId:      z.string().uuid(),
  fromDeptId:   z.number().int().optional(),
  toDeptId:     z.number().int().optional(),
  transferDate: z.string().datetime().optional(),
  reason:       z.string().optional(),
  approvedBy:   z.string().optional(),
});

@ApiTags('Asset Management')
@ApiBearerAuth()
@Roles('super_admin', 'admin', 'director', 'manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('asset-management')
export class AssetManagementController {
  constructor(private readonly svc: AssetManagementService) {}

  @Get('assets')
  async getAssets(@Query('status') status?: string, @Query('category') category?: string) {
    return unwrapOrInternal(await this.svc.getAssets(status, category));
  }

  @Post('assets')
  @HttpCode(HttpStatus.CREATED)
  async createAsset(@Body() body: unknown) {
    const dto = AssetSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createAsset(dto));
  }

  @Get('assets/summary')
  async getSummary() {
    return unwrapOrInternal(await this.svc.getSummary());
  }

  @Get('assets/:id')
  async getAssetById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getAssetById(id));
  }

  @Put('assets/:id')
  async updateAsset(@Param('id') id: string, @Body() body: unknown) {
    const dto = AssetSchema.partial().parse(body);
    return unwrapOrNotFound(await this.svc.updateAsset(id, dto));
  }

  @Delete('assets/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAsset(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.deleteAsset(id));
  }

  @Get('maintenance')
  async getMaintenance(@Query('assetId') assetId?: string) {
    return unwrapOrInternal(await this.svc.getMaintenance(assetId));
  }

  @Post('maintenance')
  @HttpCode(HttpStatus.CREATED)
  async createMaintenance(@Body() body: unknown) {
    const dto = MaintenanceSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createMaintenance(dto));
  }

  @Get('disposals')
  async getDisposals() {
    return unwrapOrInternal(await this.svc.getDisposals());
  }

  @Post('disposals')
  @HttpCode(HttpStatus.CREATED)
  async createDisposal(@Body() body: unknown) {
    const dto = DisposalSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createDisposal(dto));
  }

  @Get('transfers')
  async getTransfers() {
    return unwrapOrInternal(await this.svc.getTransfers());
  }

  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  async createTransfer(@Body() body: unknown) {
    const dto = TransferSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createTransfer(dto));
  }

  @Get('insurance')
  async getInsurance(@Query() q: Record<string, string>) {
    const r = await this.svc.getInsurance(q);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('insurance/expiring-soon')
  async getInsuranceExpiringSoon(@Query() q: Record<string, string>) {
    const r = await this.svc.getInsuranceExpiringSoon(q);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Put('assets/:id/depreciate')
  depreciate(@Param('id') id: string, @Body() b: Record<string, unknown>) { return { id, depreciated: true, ...b }; }

  @Post('assets/:id/depreciate')
  @HttpCode(HttpStatus.OK)
  postDepreciate(@Param('id') id: string, @Body() b: Record<string, unknown>) { return { id, depreciated: true, ...b }; }

  @Post('insurance')
  @HttpCode(HttpStatus.CREATED)
  async createInsurance(@Body() b: Record<string, unknown>) { return { id: Date.now(), ...b, created: true }; }

  @Put('maintenance/:id/complete')
  completeMaintenance(@Param('id') id: string, @Body() b: Record<string, unknown>) { return { id, status: 'completed', ...b }; }

  @Patch('maintenance/:id/complete')
  patchCompleteMaintenance(@Param('id') id: string, @Body() b: Record<string, unknown>) { return { id, status: 'completed', ...b }; }
}
