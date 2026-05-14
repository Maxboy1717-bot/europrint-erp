/**
 * @module ai-marketing.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {Controller, Post, Body, UseGuards, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { MarketingAiService } from '../services/marketing-ai.service';
import {
  AiMarketingGenerateContentDtoSchema, AiMarketingGenerateContentDto,
  AiMarketingAdCopyDtoSchema, AiMarketingAdCopyDto,
  AiMarketingSentimentDtoSchema, AiMarketingSentimentDto,
  AiMarketingSeoOptimizeDtoSchema, AiMarketingSeoOptimizeDto,
} from './dto/ai-marketing.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('AI — Marketing')
@ApiBearerAuth()
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('ai/marketing')
export class AiMarketingController {
  private readonly logger = new Logger(AiMarketingController.name);
  constructor(private readonly marketingAi: MarketingAiService) {}

  @Post('generate-content')
  @UseGuards(RolesGuard)
  @Roles('admin', 'marketing', 'manager', 'designer')
  @ApiOperation({ summary: 'Ijtimoiy tarmoq / blog / email kontent generatsiya' })
  @UsePipes(new ZodValidationPipe(AiMarketingGenerateContentDtoSchema))
  async generateContent(
    @Body() body: AiMarketingGenerateContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.marketingAi.generateContent(
      body.contentType, body.topic, body.targetAudience, body.language, user.id,
    ));
  }

  @Post('ad-copy')
  @UseGuards(RolesGuard)
  @Roles('admin', 'marketing', 'manager')
  @ApiOperation({ summary: 'Reklama matni generatsiya (Instagram/Telegram/Google)' })
  @UsePipes(new ZodValidationPipe(AiMarketingAdCopyDtoSchema))
  async adCopy(
    @Body() body: AiMarketingAdCopyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.marketingAi.generateAdCopy(
      body.product, body.targetAudience, body.platform, body.budget, user.id,
    ));
  }

  @Post('sentiment-analyze')
  @UseGuards(RolesGuard)
  @Roles('admin', 'marketing', 'manager', 'crm_manager')
  @ApiOperation({ summary: 'Mijoz fikrlarini sentiment tahlil' })
  @UsePipes(new ZodValidationPipe(AiMarketingSentimentDtoSchema))
  async sentimentAnalyze(
    @Body() body: AiMarketingSentimentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.marketingAi.analyzeSentiment(body.reviews, user.id));
  }

  @Post('seo-optimize')
  @UseGuards(RolesGuard)
  @Roles('admin', 'marketing', 'manager')
  @ApiOperation({ summary: 'Sahifa SEO optimizatsiyasi' })
  @UsePipes(new ZodValidationPipe(AiMarketingSeoOptimizeDtoSchema))
  async seoOptimize(
    @Body() body: AiMarketingSeoOptimizeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.marketingAi.optimizeSeo(
      body.pageTitle, body.pageContent, body.targetKeywords, user.id,
    ));
  }
}
