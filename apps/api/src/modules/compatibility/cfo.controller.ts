import { Controller, UseGuards, Get , UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { CfoCompatService } from './cfo.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('CFO Dashboard (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('cfo')
export class CfoCompatController {
  constructor(private readonly svc: CfoCompatService) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('cash-position')
  async getCashPosition() {
    return unwrapOrInternal(await this.svc.getCashPosition());
  }

  @Get('profitability')
  async getProfitability() {
    return unwrapOrInternal(await this.svc.getProfitability());
  }

  @Get('profitability-trend')
  async getProfitabilityTrend() {
    return unwrapOrInternal(await this.svc.getProfitabilityTrend());
  }

  @Get('financial-risk')
  async getFinancialRisk() {
    return unwrapOrInternal(await this.svc.getFinancialRisk());
  }
}
