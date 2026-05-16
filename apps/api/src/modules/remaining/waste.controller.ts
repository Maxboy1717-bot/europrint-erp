/**
 * @module waste.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards , UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WasteService } from './waste.service';
import { WasteBodyDto, WasteRecycleDto } from '../compatibility/dto/operations.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import {
  WasteRecordAclTranslator,
  type LegacyWasteRecordRow,
  type WasteRecordDto,
} from './acl/waste-record-acl';

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('waste')
export class WasteController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly acl = new WasteRecordAclTranslator();

  constructor(private readonly svc: WasteService) {}

  @Get('records')
  async getRecords(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getRecords(q));
  }

  /**
   * PA2-14 ACL-translated variant of waste records. New BC-2 (Manufacturing
   * / Quality) consumers should target this endpoint; the legacy `/records`
   * route stays for backwards-compat.
   */
  @Get('records/v2')
  async getRecordsV2(@Query() q: Record<string, string>): Promise<WasteRecordDto[]> {
    const rows = unwrapOrInternal(await this.svc.getRecords(q)) as unknown as LegacyWasteRecordRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.acl.toDomain(row))
      .filter((r): r is { ok: true; data: WasteRecordDto } => r.ok)
      .map((r) => r.data);
  }

  @Post('records')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'operator', 'manager')
  @HttpCode(HttpStatus.CREATED)
  async createRecord(@Body() body: WasteBodyDto) {
    return unwrapOrInternal(await this.svc.createRecord(body));
  }

  @Patch('records/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async updateRecord(@Param('id') id: string, @Body() body: WasteBodyDto) {
    return unwrapOrInternal(await this.svc.updateRecord(id, body));
  }

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('trends')
  async getTrends(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getTrends(q));
  }

  @Get('targets')
  async getTargets() {
    return unwrapOrInternal(await this.svc.getTargets());
  }

  @Post('targets')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'director', 'manager')
  @HttpCode(HttpStatus.CREATED)
  async createTarget(@Body() body: WasteBodyDto) {
    return unwrapOrInternal(await this.svc.createTarget(body));
  }

  @Get('analysis')
  async getAnalysis() {
    return unwrapOrInternal(await this.svc.getAnalysis());
  }
}
