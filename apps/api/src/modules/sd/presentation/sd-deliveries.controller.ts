/**
 * @module sd-deliveries.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, UsePipes,} from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@shared/interceptors/audit.interceptor';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { SdUpdateDeliveryStatusSchema, SdUpdateDeliveryStatusDto } from '../dto/sd.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('sd/deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('warehouse_manager', 'logistics_manager', 'super_admin')
@UseInterceptors(AuditInterceptor)
export class SdDeliveriesController {
  private readonly logger = new Logger(SdDeliveriesController.name);

  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async getDeliveries(@Query() query: Record<string, unknown>) {
    const result = await this.deliveriesService.findAll(query);
    return unwrapOrThrow(result);
  }

  @Get(':id')
  async getDelivery(@Param('id', ParseIntPipe) id: number) {
    const delivery = await this.deliveriesService.findOne(id);
    return delivery;
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(SdUpdateDeliveryStatusSchema))
  async updateDeliveryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SdUpdateDeliveryStatusDto,
  ) {
    const result = await this.deliveriesService.updateStatus(id, body.status);
    this.logger.log('Delivery status updated');
    return { statusCode: HttpStatus.OK, data: { id, status: body.status, result } };
  }
}
