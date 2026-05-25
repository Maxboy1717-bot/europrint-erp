/**
 * @module finance-variance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Param, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { VarianceAnalysisService } from '../domain/services/variance-analysis.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Finance Variance')
@ApiBearerAuth()
@Controller('finance/variance')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceVarianceController {
  constructor(
    private readonly svc: VarianceAnalysisService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Analyze order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':orderId')
  @RequirePermission('finance.variance:READ')
  async analyzeOrder(@Param('orderId') orderId: string) {
    const id = parseInt(orderId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException(await this.i18n.t('errors.orderIdMustBePositive'));
    }
    return unwrapOrInternal(await this.svc.analyzeOrder(id));
  }
}
