/**
 * @module production-facts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, Post, Query, UseGuards , UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ProductionFactsService } from './production-facts.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import {
  ProductionOperatorAclTranslator,
  type LegacyProductionOperatorRow,
  type ProductionOperatorDto,
} from './acl/production-operator-acl';

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('production-facts')
export class ProductionFactsController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly operatorAcl = new ProductionOperatorAclTranslator();

  constructor(private readonly svc: ProductionFactsService) {}

  @Get()
  async getAll(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getAll(q));
  }

  @Get('variance')
  async getVariance(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getVariance(q));
  }

  @Get('operators')
  async getOperators() {
    return unwrapOrInternal(await this.svc.getOperators());
  }

  /**
   * PA2-14 ACL-translated variant of `operators`. New BC-2 (MES)
   * consumers should target `/v2`; the legacy endpoint stays for
   * backwards-compat.
   */
  @Get('operators/v2')
  async getOperatorsV2(): Promise<ProductionOperatorDto[]> {
    const rows = unwrapOrInternal(await this.svc.getOperators()) as unknown as LegacyProductionOperatorRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.operatorAcl.toDomain(row))
      .filter((r): r is { ok: true; data: ProductionOperatorDto } => r.ok)
      .map((r) => r.data);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'operator')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.create(body));
  }
}
