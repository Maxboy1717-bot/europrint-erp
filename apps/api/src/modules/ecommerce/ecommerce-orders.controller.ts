/**
 * @module ecommerce-orders.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Put, Delete, Body, Param, Query, HttpException, HttpStatus, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  EcommerceCreateOrderSchema, EcommerceCreateOrderDto,
  EcommerceUpdateOrderStatusSchema, EcommerceUpdateOrderStatusDto,
} from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Ecommerce - Orders')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller()
export class EcommerceOrdersController {
  private readonly logger = new Logger(EcommerceOrdersController.name);

  constructor(private readonly svc: EcommerceService) {}

  @Get('admin/customer-orders')
  @Roles('admin', 'hr')
  async getCustomerOrders(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listOrders(query));
  }

  @Get('admin/customer-orders/:id')
  @Roles('admin', 'hr')
  async getCustomerOrder(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getOrder(id));
  }

  @Put('admin/customer-orders/:id/status')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceUpdateOrderStatusSchema))
  async updateOrderStatus(@Param('id') id: string, @Body() body: EcommerceUpdateOrderStatusDto) {
    return unwrapOrInternal(await this.svc.updateOrderStatus(id, body));
  }

  @Put('admin/customer-orders/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceCreateOrderSchema))
  async updateOrder(@Param('id') id: string, @Body() body: EcommerceCreateOrderDto) {
    return unwrapOrInternal(await this.svc.updateOrder(id, body));
  }

  @Delete('admin/customer-orders/:id')
  @Roles('admin', 'hr')
  deleteOrder() {
    throw new HttpException({ error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" }, HttpStatus.FORBIDDEN);
  }
}
