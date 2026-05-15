/**
 * @module voice.controller
 * @description HTTP endpoints for STT and TTS. The frontend uploads raw
 * audio (multipart) to /voice/transcribe and posts JSON {text} to
 * /voice/synthesize, which streams MP3 back.
 */

import {
  Controller, Post, Body, UseGuards, Req, Res, BadRequestException,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { WhisperService } from '../../application/voice/whisper.service';
import { ElevenLabsService } from '../../application/voice/elevenlabs.service';

const SynthesizeSchema = z.object({
  text:    z.string().min(1).max(4_000),
  voiceId: z.string().optional(),
});

@Controller('api/aisha/voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(
    private readonly whisper: WhisperService,
    private readonly eleven:  ElevenLabsService,
  ) {}

  @Post('transcribe')
  async transcribe(@Req() req: FastifyRequest): Promise<{ text: string; language: string; confidence: number }> {
    const mp = await (req as unknown as { file: () => Promise<{ toBuffer(): Promise<Buffer>; mimetype: string } | null> })
      .file();
    if (!mp) throw new BadRequestException('audio file missing (multipart)');
    const buf = await mp.toBuffer();
    const r = await this.whisper.transcribe(buf, mp.mimetype);
    if (!r.ok) throw new BadRequestException(r.error.message);
    return r.data;
  }

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
