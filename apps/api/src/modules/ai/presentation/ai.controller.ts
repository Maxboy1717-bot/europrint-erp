import { assertOk, unwrapOrThrow } from '@common/http-result';
import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  UseGuards,
  UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { CurrentUser} from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser} from '../../auth/types/authenticated-user';
import { Role} from '../../auth/types/role';
import { AiRouterService, UsageStats} from '../application/services/ai-router.service';
import { isOk } from '@common/result';
import { AiCallDto} from './dto/ai.dto';
import { AiRequest } from '../domain/types/ai.types';

@ApiTags('§15 AI Router')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
}
