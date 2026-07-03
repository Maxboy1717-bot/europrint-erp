/**
 * @module production-facts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, Post, Query, UseGuards , UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
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
   * 3.3-norma-reja-fakt: kunlik reja-fakt % dashboard.
   * Ish-markazi (work_centers.norma_m2_per_shift / norma_kg_per_shift) normasini
   * o'sha kundagi production_fact.good_quantity yig'indisi bilan solishtiradi.
   */
  @Get('plan-fact-dashboard')
  async getPlanFactDashboard(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getPlanFactDashboard(q));
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
  async create(@Body() body: CompatBodyDto, @CurrentUser() user: AuthenticatedUser) {
    // operator_id NOT NULL: use body value if numeric, else fall back to authenticated user's id
    const bodyWithOperator = {
      ...body,
      operatorId: (body as Record<string, unknown>)['operatorId'] ?? (body as Record<string, unknown>)['operator_id'] ?? user?.id ?? user?.sub ?? null,
    };
    return unwrapOrInternal(await this.svc.create(bodyWithOperator));
  }
}
