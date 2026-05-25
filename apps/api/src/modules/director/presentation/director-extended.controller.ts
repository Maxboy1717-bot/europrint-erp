/**
 * @module director-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { DirectorStateService } from '../application/director-state.service';

@ApiTags('Director — Extended')
@ApiBearerAuth()
@ApiThrottle()
@Controller('director')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DirectorExtendedController {
  constructor(private readonly stateService: DirectorStateService) {}

  @Get('wms-rental')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Warehouse rental costs this month' })
  async getWmsRental() {
    return unwrapOrInternal(await this.stateService.getWmsRental());
  }

  @Get('company-state')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Current company state (latest week)' })
  async getCurrentCompanyState() {
    return unwrapOrInternal(await this.stateService.getCurrentCompanyState());
  }

  @Get('company-state/history')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Company state history (last 8 weeks)' })
  async getCompanyStateHistory() {
    return unwrapOrInternal(await this.stateService.getCompanyStateHistory());
  }

  @Get('ideal-vs-actual')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Ideal vs actual KPIs for current week' })
  async getIdealVsActual() {
    return unwrapOrInternal(await this.stateService.getIdealVsActual());
  }

  @Post('orders/:id/vip')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Mark order as VIP priority' })
  async markVip(@Param('id', ParseIntPipe) id: number) {
    unwrapOrInternal(await this.stateService.markOrderVip(id));
    return { orderId: id, markedAt: _time.now().toISOString() };
  }
}
