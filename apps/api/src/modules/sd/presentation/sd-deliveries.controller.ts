import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, UsePipes,} from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@shared/interceptors/audit.interceptor';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { SdUpdateDeliveryStatusSchema, SdUpdateDeliveryStatusDto } from '../dto/sd.dto';

enum Role {
  WAREHOUSE_MANAGER = 'warehouse_manager',
  LOGISTICS_MANAGER = 'logistics_manager',
  SUPER_ADMIN = 'super_admin',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('sd/deliveries')
@UseGuards(RolesGuard)
@Roles(Role.WAREHOUSE_MANAGER, Role.LOGISTICS_MANAGER, Role.SUPER_ADMIN)
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
  async getDelivery(@Param('id') id: string) {
    const delivery = await this.deliveriesService.findOne(Number(id));
    return delivery;
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(SdUpdateDeliveryStatusSchema))
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: SdUpdateDeliveryStatusDto,
  ) {
    const result = await this.deliveriesService.updateStatus(Number(id), body.status);
    this.logger.log('Delivery status updated');
    return { statusCode: HttpStatus.OK, data: { id, status: body.status, result } };
  }
}
