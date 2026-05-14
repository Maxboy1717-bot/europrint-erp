/**
 * @module ai-crm.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {Controller, Post, Body, Param, ParseIntPipe, UseGuards, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CrmAiService } from '../services/crm-ai.service';
import {
  AiCrmChurnRiskDtoSchema, AiCrmChurnRiskDto,
  AiCrmEmailTemplateDtoSchema, AiCrmEmailTemplateDto,
  AiCrmNextBestActionDtoSchema, AiCrmNextBestActionDto,
} from './dto/ai-crm.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('AI — CRM')
@ApiBearerAuth()
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('ai/crm')
export class AiCrmController {
  private readonly logger = new Logger(AiCrmController.name);
  constructor(private readonly crmAi: CrmAiService) {}

  @Post('score-lead/:leadId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'crm_manager', 'manager', 'sales')
  @ApiOperation({ summary: 'Lead sifatini AI baholash (0-100 ball)' })
  async scoreLead(@Param('leadId', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.crmAi.scoreLead(id, user.id));
  }

  @Post('deal-probability/:dealId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'crm_manager', 'manager', 'sales')
  @ApiOperation({ summary: 'Bitim yopilish ehtimolini bashorat qilish' })
  async dealProbability(@Param('dealId', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.crmAi.predictDealProbability(id, user.id));
  }

  @Post('churn-risk/:contactId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'crm_manager', 'manager')
  @ApiOperation({ summary: 'Mijoz ketish xavfini baholash' })
  @UsePipes(new ZodValidationPipe(AiCrmChurnRiskDtoSchema))
  async churnRisk(
    @Param('contactId', ParseIntPipe) id: number,
    @Body() body: AiCrmChurnRiskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.crmAi.assessChurnRisk(id, body.activityData, user.id));
  }

  @Post('email-template')
  @UseGuards(RolesGuard)
  @Roles('admin', 'crm_manager', 'sales', 'manager')
  @ApiOperation({ summary: 'AI email shabloni generatsiya (follow-up, proposal, re-engage)' })
  @UsePipes(new ZodValidationPipe(AiCrmEmailTemplateDtoSchema))
  async emailTemplate(
    @Body() body: AiCrmEmailTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.crmAi.generateEmailTemplate(body.purpose, body.contactName, body.context, user.id));
  }

  @Post('next-best-action/:dealId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'crm_manager', 'sales', 'manager')
  @ApiOperation({ summary: 'Keyingi eng yaxshi harakat tavsiyasi (NBA)' })
  @UsePipes(new ZodValidationPipe(AiCrmNextBestActionDtoSchema))
  async nextBestAction(
    @Param('dealId', ParseIntPipe) id: number,
    @Body() body: AiCrmNextBestActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.crmAi.nextBestAction(id, body.lastActivities, user.id));
  }
}
