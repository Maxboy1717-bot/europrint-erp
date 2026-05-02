import { Controller, Get, Param, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { VarianceAnalysisService } from '../domain/services/variance-analysis.service';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/variance')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceVarianceController {
  constructor(private readonly svc: VarianceAnalysisService) {}

  @Get(':orderId')
  @RequirePermission('finance.variance:READ')
  async analyzeOrder(@Param('orderId') orderId: string) {
    const id = parseInt(orderId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('orderId musbat butun son bo\'lishi kerak');
    }
    return unwrapOrInternal(await this.svc.analyzeOrder(id));
  }
}
