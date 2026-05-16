/**
 * @module wake-config.controller
 * @description Serves the Porcupine bootstrap config (access key + ppn URL)
 * and lets the Director adjust wake-word sensitivity. The .ppn file must be
 * served by the frontend's static assets — we only emit the URL.
 */

import { Controller, Get, Patch, Body, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AishaConfig } from '../../config/aisha.config';

const SensitivitySchema = z.object({
  sensitivity: z.number().min(0).max(1),
});

interface AuthedReq extends FastifyRequest {
  user?: { id?: number; userId?: number; role?: string };
}

@ApiTags('Wake Config')
@ApiBearerAuth()
@Controller('aisha/wake')
@UseGuards(JwtAuthGuard)
export class WakeConfigController {
  private currentSensitivity: number;

  constructor(
    private readonly cfg: AishaConfig,
    private readonly i18n: I18nService,
  ) {
    this.currentSensitivity = cfg.wakeSensitivity;
  }

  @ApiOperation({ summary: 'Config' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('config')
  config(): { accessKey: string; ppnUrl: string; sensitivity: number; voiceId: string } {
    return {
      accessKey:   this.cfg.picovoiceKey,
      ppnUrl:      '/aisha/assets/aisha.ppn',
      sensitivity: this.currentSensitivity,
      voiceId:     this.cfg.elevenLabsVoiceId,
    };
  }

  @ApiOperation({ summary: 'Set sensitivity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('sensitivity')
  async setSensitivity(@Body() body: unknown, @Req() req: AuthedReq): Promise<{ sensitivity: number }> {
    const userId = req.user?.userId ?? req.user?.id;
    if (userId !== this.cfg.directorUserId) {
      throw new ForbiddenException(await this.i18n.t('errors.onlyDirectorCanChangeSensitivity'));
    }
    const dto = SensitivitySchema.parse(body);
    this.currentSensitivity = dto.sensitivity;
    return { sensitivity: dto.sensitivity };
  }
}
