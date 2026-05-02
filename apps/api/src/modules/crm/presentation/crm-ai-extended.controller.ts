import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmAiExtendedService } from '../application/crm-ai-extended.service';
import { AutofillDtoSchema, AutofillDto } from './dto/crm-ai-extended.dto';
import { CrmAiService } from '../application/crm-ai.service';

const CRM_AI_ROLES = ['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...CRM_AI_ROLES)
export class CrmAiExtendedController {
  private readonly logger = new Logger(CrmAiExtendedController.name);

  constructor(
    private readonly svc: CrmAiExtendedService,
    private readonly crmAiSvc: CrmAiService,
  ) {}

  @Get('autofill/:entityType/:id')
  async autofill(@Param('entityType') entityType: string, @Param('id') id: string) {
    return unwrapOrThrow(await this.svc.autofill(entityType, safeInt(id, 0)));
  }

  @Get('churn-rescue/:entityType/:id')
  async churnRescue(@Param('entityType') entityType: string, @Param('id') id: string) {
    return unwrapOrThrow(await this.svc.analyzeChurn(entityType, safeInt(id, 0)));
  }

  @Get('extended/auto-tasks/suggest')
  async suggestAutoTasks(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return unwrapOrThrow(await this.svc.suggestAutoTasks(entityType ?? '', safeInt(entityId, 0)));
  }

  @Get('leads')
  async getAiLeads(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.getAiLeads(safeInt(limit, 20), safeInt(offset, 0)));
  }

  @Get('nba')
  async getAiNba(@Query('entityType') entityType?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getAiNba(entityType ?? null, safeInt(limit, 10)));
  }

  @Get('quick-score/:entityType/:id')
  async getAiQuickScore(@Param('entityType') entityType: string, @Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getAiQuickScore(entityType, safeInt(id, 0)));
  }

  @Post('autofill/:entityId')
  @UsePipes(new ZodValidationPipe(AutofillDtoSchema))
  async postAutofill(
    @Param('entityId') entityId: string,
    @Body() body: AutofillDto,
  ) {
    const entityType = typeof body['entityType'] === 'string' ? body['entityType'] : 'lead';
    return unwrapOrThrow(await this.svc.autofill(entityType, safeInt(entityId, 0)));
  }

  @Post('leads/:entityId/scoring-v2')
  @UsePipes(new ZodValidationPipe(AutofillDtoSchema))
  async scoreLeadV2(
    @Param('entityId') entityId: string,
    @Body() _body: AutofillDto,
  ) {
    return unwrapOrThrow(await this.crmAiSvc.scoreLeadV2(safeInt(entityId, 0)));
  }
}
