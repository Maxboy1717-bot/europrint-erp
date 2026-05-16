/**
 * @module ai-wms.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {Controller, Post, Body, UseGuards, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { WmsAiService } from '../services/wms-ai.service';
import {
  AiWmsReorderPointDtoSchema, AiWmsReorderPointDto,
  AiWmsOptimizeStockDtoSchema, AiWmsOptimizeStockDto,
  AiWmsDeliveryPredictDtoSchema, AiWmsDeliveryPredictDto,
  AiWmsRouteOptimizeDtoSchema, AiWmsRouteOptimizeDto,
} from './dto/ai-wms.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('AI — WMS')
@ApiBearerAuth()
@AiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('ai/wms')
export class AiWmsController {
  private readonly logger = new Logger(AiWmsController.name);
  constructor(private readonly wmsAi: WmsAiService) {}

  @Post('reorder-point')
  @UseGuards(RolesGuard)
  @Roles('admin', 'warehouse_manager', 'manager')
  @ApiOperation({ summary: 'Maxsulot uchun qayta buyurtma nuqtasini hisoblash' })
  @UsePipes(new ZodValidationPipe(AiWmsReorderPointDtoSchema))
  async reorderPoint(
    @Body() body: AiWmsReorderPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.wmsAi.calculateReorderPoint(
      body.itemName, body.currentStock, body.avgDailyUsage,
      body.leadTimeDays, body.historicalUsage, user.id,
    ));
  }

  @Post('optimize-stock')
  @UseGuards(RolesGuard)
  @Roles('admin', 'warehouse_manager', 'manager')
  @ApiOperation({ summary: 'Ombor zaxirasini optimallashtirish tavsiyalari' })
  @UsePipes(new ZodValidationPipe(AiWmsOptimizeStockDtoSchema))
  async optimizeStock(
    @Body() body: AiWmsOptimizeStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.wmsAi.optimizeStock(body.inventorySnapshot as Parameters<typeof this.wmsAi.optimizeStock>[0], user.id));
  }

  @Post('delivery-predict')
  @UseGuards(RolesGuard)
  @Roles('admin', 'warehouse_manager', 'logistics', 'manager')
  @ApiOperation({ summary: 'Yetkazib berish muddatini bashorat qilish' })
  @UsePipes(new ZodValidationPipe(AiWmsDeliveryPredictDtoSchema))
  async deliveryPredict(
    @Body() body: AiWmsDeliveryPredictDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.wmsAi.predictDelivery(
      body.origin, body.destination, body.itemType,
      body.orderDate, body.historicalDeliveries as Parameters<typeof this.wmsAi.predictDelivery>[4], user.id,
    ));
  }

  @Post('route-optimize')
  @UseGuards(RolesGuard)
  @Roles('admin', 'logistics', 'driver', 'manager')
  @ApiOperation({ summary: 'Yetkazib berish marshruti optimizatsiyasi' })
  @UsePipes(new ZodValidationPipe(AiWmsRouteOptimizeDtoSchema))
  async routeOptimize(
    @Body() body: AiWmsRouteOptimizeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.wmsAi.optimizeRoute(body.deliveries as Parameters<typeof this.wmsAi.optimizeRoute>[0], body.startLocation, user.id));
  }
}
