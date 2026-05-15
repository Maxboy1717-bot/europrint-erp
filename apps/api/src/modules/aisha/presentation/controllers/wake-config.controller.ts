/**
 * @module wake-config.controller
 * @description Serves the Porcupine bootstrap config (access key + ppn URL)
 * and lets the Director adjust wake-word sensitivity. The .ppn file must be
 * served by the frontend's static assets — we only emit the URL.
 */

import { Controller, Get, Patch, Body, UseGuards, ForbiddenException, Req } from '@nestjs/common';
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

@Controller('aisha/wake')
@UseGuards(JwtAuthGuard)
export class WakeConfigController {
  private currentSensitivity: number;

  constructor(private readonly cfg: AishaConfig) {
    this.currentSensitivity = cfg.wakeSensitivity;
  }

  @Get('config')
  config(): { accessKey: string; ppnUrl: string; sensitivity: number; voiceId: string } {
    return {
      accessKey:   this.cfg.picovoiceKey,
      ppnUrl:      '/aisha/assets/aisha.ppn',
      sensitivity: this.currentSensitivity,
      voiceId:     this.cfg.elevenLabsVoiceId,
    };
  }

  @Patch('sensitivity')
  setSensitivity(@Body() body: unknown, @Req() req: AuthedReq): { sensitivity: number } {
    const userId = req.user?.userId ?? req.user?.id;
    if (userId !== this.cfg.directorUserId) {
      throw new ForbiddenException('Faqat direktor sensitivity\'ni o\'zgartira oladi');
    }
    const dto = SensitivitySchema.parse(body);
    this.currentSensitivity = dto.sensitivity;
    return { sensitivity: dto.sensitivity };
  }
}
