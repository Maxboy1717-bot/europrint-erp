/**
 * @module order-status.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, Param, Post, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { OrderStatusService, STATUS_TRANSITIONS } from './order-status.service';
import { ExceptionLogService } from './exception-log.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

@Roles('admin', 'director', 'manager', 'super_admin', 'sales_manager')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('order-status')
export class OrderStatusController {
  constructor(
    private readonly svc: OrderStatusService,
    private readonly exceptionLogSvc: ExceptionLogService,
  ) {}

  @Get('chain')
  getStatusChain() {
    const r = this.svc.getStatusChain();
    assertOk(r);
    return r.data;
  }

  @Get('transitions')
  getTransitions() {
    return STATUS_TRANSITIONS;
  }

  @Get(':orderId/log')
  async getStatusLog(@Param('orderId') orderId: string) {
    return unwrapOrThrow(await this.svc.getStatusLog(orderId));
  }

  @Post(':orderId/transition')
  @HttpCode(HttpStatus.OK)
  async transition(
    @Param('orderId') orderId: string,
    @Body() body: CompatBodyDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.transition(orderId, body, user.id));
  }

  @Post(':orderId/design-approved')
  @HttpCode(HttpStatus.OK)
  async designApproved(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.designApproved(orderId, user.id));
  }

  @Post(':orderId/tech-approved')
  @HttpCode(HttpStatus.OK)
  async techApproved(@Param('orderId') orderId: string) {
    return unwrapOrThrow(await this.svc.techApproved(orderId));
  }

  @Post(':orderId/advance-received')
  @HttpCode(HttpStatus.OK)
  async advanceReceived(@Param('orderId') orderId: string) {
    return unwrapOrThrow(await this.svc.advanceReceived(orderId));
  }

  @Post(':orderId/qc-result')
  @HttpCode(HttpStatus.OK)
  async qcResult(@Param('orderId') orderId: string, @Body() body: CompatBodyDto) {
    return unwrapOrThrow(await this.svc.qcResult(orderId, body));
  }

  @Post(':orderId/mes-complete')
  @HttpCode(HttpStatus.OK)
  async mesComplete(@Param('orderId') orderId: string) {
    return unwrapOrThrow(await this.svc.mesComplete(orderId));
  }

  @Post(':orderId/delivery-failed')
  @HttpCode(HttpStatus.OK)
  async deliveryFailed(@Param('orderId') orderId: string) {
    return unwrapOrThrow(await this.svc.deliveryFailed(orderId));
  }

  @Get(':orderId/machine-breakdown')
  async getMachineBreakdown(@Param('orderId') orderId: string) {
    return this.exceptionLogSvc.getMachineBreakdown(orderId);
  }
}
