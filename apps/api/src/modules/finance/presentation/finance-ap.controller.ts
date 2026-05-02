import { Controller, Get, Post, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceApService } from '../application/finance-ap.service';


@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('ap')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'admin')
export class FinanceApController {
  private readonly logger = new Logger(FinanceApController.name);

  constructor(private readonly svc: FinanceApService) {}

  @Get('aging')
  async getAgingBuckets() {
    const _rAging = await this.svc.getAgingBuckets();
    assertOk(_rAging);
    const { buckets, totals } = _rAging.data as { buckets: Record<string, unknown>[]; totals: Record<string, unknown> };
    const t = totals as Record<string, unknown>;
    return {
      buckets,
      totals: {
        current: Number(t.current) || 0,
        days31to60: Number(t.days31to60) || 0,
        days61to90: Number(t.days61to90) || 0,
        days91to120: Number(t.days91to120) || 0,
        over120: Number(t.over120) || 0,
        totalOutstanding: Number(t.total_outstanding) || 0,
      },
    };
  }

  @Get('overdue')
  async getOverdue() {
    return unwrapOrInternal(await this.svc.getOverdue());
  }

  @Post('aging/recalculate')
  async recalculateAging() {
    const bucketsUpdated = await this.svc.recalculateAging();
    return { bucketsUpdated };
  }
}
