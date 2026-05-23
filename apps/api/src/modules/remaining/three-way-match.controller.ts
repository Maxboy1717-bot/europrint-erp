/**
 * @module three-way-match.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Post, Query, UseGuards , UseInterceptors} from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ThreeWayMatchService } from '../pos/application/services/three-way-match.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';
import {
  ThreeWayMatchAclTranslator,
  type LegacyThreeWayMatchRow,
  type ThreeWayMatchResultDto,
} from './acl/three-way-match-acl';

const CAN_VIEW  = ['admin', 'super_admin', 'director', 'finance_manager', 'accountant', 'procurement_manager'];
const CAN_MATCH = ['admin', 'super_admin', 'finance_manager', 'accountant'];

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('3way-match')
export class ThreeWayMatchController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly matchAcl = new ThreeWayMatchAclTranslator();

  constructor(private readonly svc: ThreeWayMatchService) {}

  @Get('results')
  @UseGuards(RolesGuard)
  @Roles(...CAN_VIEW)
  async getResults(@Query() q: Record<string, string>) {
    const poId = q['poId'] ? parseInt(q['poId'], 10) : null;
    const { limit } = parsePagination(q['limit']);
    return unwrapOrInternal(await this.svc.getResults(poId, limit));
  }

  /**
   * PA2-14 ACL-translated variant of `results`. New BC-6 / BC-7 consumers
   * should target `/v2`; the legacy endpoint stays for backwards-compat.
   *
   * The legacy service returns `{ data: rows }`; this endpoint preserves
   * the envelope while translating the row array.
   */
  @Get('results/v2')
  @UseGuards(RolesGuard)
  @Roles(...CAN_VIEW)
  async getResultsV2(@Query() q: Record<string, string>): Promise<{ data: ThreeWayMatchResultDto[] }> {
    const poId = q['poId'] ? parseInt(q['poId'], 10) : null;
    const { limit } = parsePagination(q['limit']);
    const wrapped = unwrapOrInternal(await this.svc.getResults(poId, limit)) as unknown as {
      data: LegacyThreeWayMatchRow[];
    };
    const list = Array.isArray(wrapped?.data) ? wrapped.data : [];
    const data = list
      .map((row) => this.matchAcl.toDomain(row))
      .filter((r): r is { ok: true; data: ThreeWayMatchResultDto } => r.ok)
      .map((r) => r.data);
    return { data };
  }

  @Post('perform')
  @UseGuards(RolesGuard)
  @Roles(...CAN_MATCH)
  async perform(
    @Body() body: CompatBodyDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.perform(body, user.id));
  }
}
