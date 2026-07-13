/**
 * @module ai.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrThrow } from '@common/http-result';
import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
  UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth} from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { CurrentUser} from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser} from '../../auth/types/authenticated-user';
import { Role} from '@common/constants/roles.constants';
import { AiRouterService, UsageStats} from '../application/services/ai-router.service';
import { isOk } from '@common/result';
import { AiCallDto} from './dto/ai.dto';
import { AiRequest } from '../domain/types/ai.types';
import { z } from 'zod';
import { DemandForecastService, DemandForecastResponse } from '../application/services/demand-forecast.service';
import { RushOrdersService, RushOrderDto } from '../application/services/rush-orders.service';

const RejectRushOrderSchema = z.object({
  reason: z.string().max(2000).optional(),
}).passthrough();

/** :id route param -> positive integer order_id, or 400 (never NaN silently reaching the repo). */
function parseOrderId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(`Noto'g'ri buyurtma id: ${raw}`);
  }
  return id;
}



@ApiTags('§15 AI Router')
// AI endpointlar - LLM chaqiruvi qimmat, 20/daq cheklov (env: THROTTLE_AI_LIMIT)
@AiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('ai')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class AiController {
 private readonly logger = new Logger(AiController.name);

 constructor(
 private readonly aiRouter: AiRouterService,
 private readonly i18n: I18nService,
 private readonly demandForecastSvc: DemandForecastService,
 private readonly rushOrdersSvc: RushOrdersService,
 ) {}

 @Post('call')
 @HttpCode(HttpStatus.OK)
 @Roles(
 Role.SUPER_ADMIN,
 Role.DIRECTOR,
 Role.HR_MANAGER,
 Role.SALES_MANAGER,
 Role.FINANCE_MANAGER,
 Role.PRODUCTION_MANAGER,
 )
 @ApiOperation({
 summary: 'Call AI service',
 description:
 'Route request to appropriate AI provider (OpenAI, Gemini, Claude) based on task type with automatic fallback',
})
 @ApiResponse({
 status: 200,
 description: 'AI response generated successfully',
 schema: {
 type: 'object',
 properties: {
 text: { type: 'string', description: 'Generated text response'},
 provider: { type: 'string', enum: ['openai', 'gemini', 'claude']},
 model: { type: 'string'},
 inputTokens: { type: 'number'},
 outputTokens: { type: 'number'},
 estimatedCostUsd: { type: 'number', format: 'double'},
 latencyMs: { type: 'number'},
},
},
})
 @ApiResponse({
 status: 400,
 description: 'Invalid request or budget exceeded',
})
 @ApiResponse({
 status: 401,
 description: 'Unauthorized',
})
 @ApiResponse({
 status: 403,
 description: 'Forbidden',
})
 async call(@Body() dto: AiCallDto, @CurrentUser() user: AuthenticatedUser) {
 this.logger.log(`[AI] Request from user ${user.id}: ${dto.taskType}`);

 const response = await this.aiRouter.call({
 ...dto,
 userId: user.id,
} as AiRequest);

 return response;
}

 @Get('budget')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
 @ApiOperation({
 summary: 'Get AI usage statistics',
 description: 'Get daily budget status and usage statistics by provider and task type',
})
 @ApiResponse({
 status: 200,
 description: 'Usage statistics',
 schema: {
 type: 'object',
 properties: {
 today: {
 type: 'object',
 properties: {
 spent: { type: 'number'},
 remaining: { type: 'number'},
 budget: { type: 'number'},
 requestCount: { type: 'number'},
},
},
 byProvider: {
 type: 'object',
 additionalProperties: {
 type: 'object',
 properties: {
 spent: { type: 'number'},
 requestCount: { type: 'number'},
},
},
},
 topTaskTypes: {
 type: 'array',
 items: {
 type: 'object',
 properties: {
 taskType: { type: 'string'},
 spent: { type: 'number'},
 count: { type: 'number'},
},
},
},
},
},
})
 @ApiResponse({
 status: 401,
 description: 'Unauthorized',
})
 @ApiResponse({
 status: 403,
 description: 'Forbidden',
})
 async getBudget(): Promise<UsageStats> {
 const result = await this.aiRouter.getUsageStats();

 const _d = unwrapOrThrow(result);
 assertFound(_d, await this.i18n.t('errors.dataNotAvailable'));
 return _d;
}

 @Get('bottleneck/analysis')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({ summary: 'AI bottleneck tahlili' })
 getBottleneckAnalysis() {
   return { bottlenecks: [], analyzedAt: new Date().toISOString() };
 }

 @Get('forecast/demand')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({
 summary: 'AI talab bashorati',
 description:
 'Har mahsulot bo\'yicha real sales_orders tarixiga asoslangan EMA bashorat (TZ-06). ' +
 'Agar hali yetarli tarixiy buyurtma bo\'lmasa (business_settings ai.forecast_min_orders ' +
 'chegarasidan kam), status="insufficient_history" bilan aniq javob qaytadi — soxta/bo\'sh natija emas.',
 })
 @ApiResponse({
 status: 200,
 description: 'Real forecast (status=ok) yoki tarix yetarli emasligi haqida aniq javob (status=insufficient_history)',
 schema: {
 type: 'object',
 properties: {
 status: { type: 'string', enum: ['ok', 'insufficient_history'] },
 minRequiredOrders: { type: 'number' },
 currentOrders: { type: 'number' },
 message: { type: 'string' },
 items: {
 type: 'array',
 items: {
 type: 'object',
 properties: {
 productId: { type: 'number' },
 productName: { type: 'string' },
 unit: { type: 'string' },
 currentMonthDemand: { type: 'number' },
 forecastNext1Month: { type: 'number' },
 forecastNext3Months: { type: 'number' },
 confidence: { type: 'number' },
 trend: { type: 'string', enum: ['up', 'down', 'flat'] },
 modelName: { type: 'string' },
},
},
},
},
},
})
 async getDemandForecast(): Promise<DemandForecastResponse> {
 const result = await this.demandForecastSvc.getDemandForecast();
 return unwrapOrThrow(result);
 }

 @Get('rush-orders')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({
 summary: 'Shoshilinch (rush) buyurtmalar ro\'yxati',
 description:
 'Talab qilingan yetkazib berish sanasi buyurtma yaratilgan kundan business_settings ' +
 '"rush_order_max_lead_days" chegarasida bo\'lgan buyurtmalar (yoki allaqachon ' +
 'tasdiqlangan/rad etilgan rush buyurtmalar, joriy holati bilan).',
 })
 @ApiResponse({
 status: 200,
 description: 'Rush buyurtmalar ro\'yxati',
 schema: {
 type: 'object',
 properties: {
 items: {
 type: 'array',
 items: {
 type: 'object',
 properties: {
 orderId: { type: 'number' },
 orderNumber: { type: 'string' },
 customerName: { type: 'string' },
 requestedDate: { type: 'string' },
 standardLeadDays: { type: 'number' },
 rushLeadDays: { type: 'number' },
 rushSurchargePct: { type: 'number' },
 feasibilityScore: { type: 'number' },
 status: { type: 'string', enum: ['pending_approval', 'approved', 'rejected'] },
},
},
},
},
},
})
 async getRushOrders(): Promise<{ items: RushOrderDto[] }> {
 const result = await this.rushOrdersSvc.listRushOrders();
 return unwrapOrThrow(result);
 }

 @Post('rush-orders/:id/approve')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({ summary: 'Shoshilinch buyurtmani tasdiqlash' })
 @ApiResponse({ status: 200, description: 'Tasdiqlangan rush buyurtma' })
 @ApiResponse({ status: 400, description: 'Buyurtma rush shartiga mos kelmaydi' })
 @ApiResponse({ status: 404, description: 'Buyurtma topilmadi' })
 @ApiResponse({ status: 409, description: 'Rush buyurtma allaqachon qaror qilingan' })
 async approveRushOrder(
 @Param('id') id: string,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<RushOrderDto> {
 const orderId = parseOrderId(id);
 const result = await this.rushOrdersSvc.approve(orderId, user.id);
 return unwrapOrThrow(result);
 }

 @Post('rush-orders/:id/reject')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({ summary: 'Shoshilinch buyurtmani rad etish' })
 @ApiResponse({ status: 200, description: 'Rad etilgan rush buyurtma' })
 @ApiResponse({ status: 400, description: 'Buyurtma rush shartiga mos kelmaydi' })
 @ApiResponse({ status: 404, description: 'Buyurtma topilmadi' })
 @ApiResponse({ status: 409, description: 'Rush buyurtma allaqachon qaror qilingan' })
 async rejectRushOrder(
 @Param('id') id: string,
 @Body() body: unknown,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<RushOrderDto> {
 const orderId = parseOrderId(id);
 const dto = RejectRushOrderSchema.parse(body);
 const result = await this.rushOrdersSvc.reject(orderId, user.id, dto.reason ?? null);
 return unwrapOrThrow(result);
 }

 @Get('shift/recommendations')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.HR_MANAGER)
 @ApiOperation({ summary: 'AI smena tavsiyalari' })
 getShiftRecommendations() {
   return { recommendations: [], generatedAt: new Date().toISOString() };
 }
}
