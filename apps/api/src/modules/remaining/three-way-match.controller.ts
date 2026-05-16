/**
 * @module three-way-match.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Post, Query, UseGuards , UseInterceptors} from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ThreeWayMatchService } from './three-way-match.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';

const CAN_VIEW  = ['admin', 'super_admin', 'director', 'finance_manager', 'accountant', 'procurement_manager'];
const CAN_MATCH = ['admin', 'super_admin', 'finance_manager', 'accountant'];

@ApiThrottle()
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
    const { limit } = parsePagination(q['limit']);
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
