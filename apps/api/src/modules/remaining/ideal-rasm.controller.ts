/**
 * @module ideal-rasm.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { IdealRasmService } from './ideal-rasm.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import {
  IdealTargetAclTranslator,
  type LegacyIdealTargetRow,
  type IdealTargetDto,
} from './acl/ideal-target-acl';

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('ideal-rasm')
export class IdealRasmController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly targetAcl = new IdealTargetAclTranslator();

  constructor(private readonly svc: IdealRasmService) {}

  @Post()
  async create() {
    return { success: true };
  }

  @Get()
  async getAll() {
    return unwrapOrInternal(await this.svc.getAll());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-9 (Director / Strategy) consumers
   * should target this endpoint; the legacy `GET /ideal-rasm` route stays
   * for backwards-compat.
   */
  @Get('v2')
  async getAllV2(): Promise<{ targets: IdealTargetDto[]; total: number }> {
    const raw = unwrapOrInternal(await this.svc.getAll()) as unknown as { targets?: unknown };
    const rows = raw && Array.isArray(raw.targets) ? raw.targets : [];
    const targets = rows
      .map((row) => this.targetAcl.toDomain(row as unknown as LegacyIdealTargetRow))
      .filter((r): r is { ok: true; data: IdealTargetDto } => r.ok)
      .map((r) => r.data);
    return { targets, total: targets.length };
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('director', 'super_admin', 'admin')
  async updateAll(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateAll(body));
  }

  @Put(':key')
  @UseGuards(RolesGuard)
  @Roles('director', 'super_admin', 'admin')
  async updateOne(@Param('key') key: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateOne(key, body));
  }
}
