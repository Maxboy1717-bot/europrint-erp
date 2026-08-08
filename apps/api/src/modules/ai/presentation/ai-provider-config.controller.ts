/**
 * @module ai-provider-config.controller
 * @description AI provayder konfiguratsiyasi — admin endpointlari.
 *   GET  /api/ai/provider-configs           — barcha provider konfiguratsiyasi
 *   PATCH /api/ai/provider-configs/:provider — bitta providerni yangilash (upsert)
 * @layer Presentation (AI)
 */

import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { Role } from '@common/constants/roles.constants';
import {
  AI_PROVIDER_CONFIG_REPO,
  type IAiProviderConfigRepo,
} from '../domain/repositories/i-ai-provider-config.repo';
import type { AiProvider } from '../domain/types/ai.types';
import type { InsertAiProviderConfig } from '@workspace/db';

const ProviderParamSchema = z.enum(['openai', 'gemini', 'claude']);

const UpdateProviderConfigBodySchema = z.object({
  defaultModel: z.string().max(100).nullish(),
  dailyBudgetUsd: z.union([z.number().positive(), z.string()]).nullish(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).nullish(),
  apiKeyHint: z.string().max(20).nullish(),
});

@ApiTags('§15 AI Provider Config')
@Controller('ai/provider-configs')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class AiProviderConfigController {
  constructor(
    @Inject(AI_PROVIDER_CONFIG_REPO)
    private readonly repo: IAiProviderConfigRepo,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'AI provayder konfiguratsiyalari ro\'yxati' })
  async findAll(): Promise<{ data: unknown[] }> {
    const result = await this.repo.findAll();
    const data = unwrapOrThrow(result);
    return { data: Array.isArray(data) ? data : [] };
  }

  @Patch(':provider')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'AI provayder konfiguratsiyasini yangilash (upsert)' })
  async update(
    @Param('provider') providerParam: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const provider: AiProvider = ProviderParamSchema.parse(providerParam);
    const patch = UpdateProviderConfigBodySchema.parse(body);

    const payload: InsertAiProviderConfig = {
      provider,
      ...(patch.defaultModel !== undefined ? { defaultModel: patch.defaultModel } : {}),
      ...(patch.dailyBudgetUsd !== undefined && patch.dailyBudgetUsd !== null
        ? { dailyBudgetUsd: String(patch.dailyBudgetUsd) }
        : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.apiKeyHint !== undefined ? { apiKeyHint: patch.apiKeyHint } : {}),
      updatedByUserId: user.id,
    } as InsertAiProviderConfig;

    const result = await this.repo.upsert(payload);
    return unwrapOrThrow(result);
  }
}
