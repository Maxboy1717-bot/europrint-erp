/**
 * @module voice.controller
 * @description HTTP endpoints for STT and TTS. The frontend uploads raw
 * audio (multipart) to /voice/transcribe and posts JSON {text} to
 * /voice/synthesize, which streams MP3 back.
 */

import {
  Controller, Post, Body, UseGuards, Req, Res, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { WhisperService } from '../../application/voice/whisper.service';
import { ElevenLabsService } from '../../application/voice/elevenlabs.service';

const SynthesizeSchema = z.object({
  text:    z.string().min(1).max(4_000),
  voiceId: z.string().optional(),
});

@ApiTags('Voice')
@ApiBearerAuth()
@Controller('aisha/voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(
    private readonly whisper: WhisperService,
    private readonly eleven:  ElevenLabsService,
    private readonly i18n:    I18nService,
  ) {}

  @ApiOperation({ summary: 'Transcribe' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('transcribe')
  async transcribe(@Req() req: FastifyRequest): Promise<{ text: string; language: string; confidence: number }> {
    const mp = await (req as unknown as { file: () => Promise<{ toBuffer(): Promise<Buffer>; mimetype: string } | null> })
      .file();
    if (!mp) throw new BadRequestException(await this.i18n.t('errors.audioFileRequired'));
    const buf = await mp.toBuffer();
    const r = await this.whisper.transcribe(buf, mp.mimetype);
    if (!r.ok) throw new BadRequestException(r.error.message);
    return r.data;
  }

  @ApiOperation({ summary: 'Synthesize' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('synthesize')
  async synthesize(@Body() body: unknown, @Res() reply: FastifyReply): Promise<void> {
    const dto = SynthesizeSchema.parse(body);
    reply.raw.setHeader('Content-Type', 'audio/mpeg');
    reply.raw.setHeader('Transfer-Encoding', 'chunked');
    try {
      for await (const chunk of this.eleven.synthesizeStream(dto.text, dto.voiceId)) {
        reply.raw.write(chunk);
      }
      reply.raw.end();
    } catch (err) {
      reply.raw.destroy(err as Error);
    }
  }
}
