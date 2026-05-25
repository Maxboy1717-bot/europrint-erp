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
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { CurrentUser} from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser} from '../../auth/types/authenticated-user';
import { Role} from '../../auth/types/role';
import { AiRouterService, UsageStats} from '../application/services/ai-router.service';
import { isOk } from '@common/result';
import { AiCallDto} from './dto/ai.dto';
import { AiRequest } from '../domain/types/ai.types';
import { z } from 'zod';
import { notImplemented } from '@common/exceptions/not-implemented';

const RejectRushOrderSchema = z.object({
  reason: z.string().max(2000).optional(),
}).passthrough();



@ApiTags('§15 AI Router')
// AI endpointlar - LLM chaqiruvi qimmat, 20/daq cheklov (env: THROTTLE_AI_LIMIT)
@AiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('ai')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class AiController {
 private readonly logger = new Logger(AiController.name);

 constructor(private readonly aiRouter: AiRouterService) {}

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
 assertFound(_d, 'Data not available');
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
 @ApiOperation({ summary: 'AI talab bashorati' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-5' })
 getDemandForecast() {
   return notImplemented('GET /ai/forecast/demand');
 }

 @Get('rush-orders')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({ summary: 'Shoshilinch buyurtmalar ro\'yxati' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-5' })
 getRushOrders() {
   return notImplemented('GET /ai/rush-orders');
 }

 @Post('rush-orders/:id/approve')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({ summary: 'Shoshilinch buyurtmani tasdiqlash' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-5' })
 approveRushOrder(@Param('id') _id: string) {
   return notImplemented('POST /ai/rush-orders/:id/approve');
 }

 @Post('rush-orders/:id/reject')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
 @ApiOperation({ summary: 'Shoshilinch buyurtmani rad etish' })
 @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-5' })
 rejectRushOrder(@Param('id') _id: string, @Body() body: unknown) {
   RejectRushOrderSchema.parse(body);
   return notImplemented('POST /ai/rush-orders/:id/reject');
 }

 @Get('shift/recommendations')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.HR_MANAGER)
 @ApiOperation({ summary: 'AI smena tavsiyalari' })
 getShiftRecommendations() {
   return { recommendations: [], generatedAt: new Date().toISOString() };
 }
}
