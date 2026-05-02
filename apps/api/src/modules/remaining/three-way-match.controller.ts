import { Body, Controller, Get, Post, Query, UseGuards , UseInterceptors} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ThreeWayMatchService } from './three-way-match.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { unwrapOrInternal } from '@common/http-result';

const CAN_VIEW  = ['admin', 'super_admin', 'director', 'finance_manager', 'accountant', 'procurement_manager'];
const CAN_MATCH = ['admin', 'super_admin', 'finance_manager', 'accountant'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('3way-match')
export class ThreeWayMatchController {
  constructor(private readonly svc: ThreeWayMatchService) {}

  @Get('results')
  @UseGuards(RolesGuard)
  @Roles(...CAN_VIEW)
  async getResults(@Query() q: Record<string, string>) {
    const poId = q['poId'] ? parseInt(q['poId'], 10) : null;
    const limit = Math.min(parseInt(q['limit'] ?? '50', 10), MAX_QUERY_LIMIT);
    return unwrapOrInternal(await this.svc.getResults(poId, limit));
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
