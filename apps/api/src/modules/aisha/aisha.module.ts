/**
 * @module aisha.module
 * @description Voice-only AI assistant for the Director. Integrates with all
 * 55 business modules via the tool registry. Lives inside the Director
 * Dashboard (not a standalone page). Provides full data provenance for every
 * answer (which tool, which source table, when queried).
 *
 * Routes registered:
 *   GET    /api/aisha/wake/config       — Porcupine bootstrap
 *   PATCH  /api/aisha/wake/sensitivity  — director-only sensitivity tune
 *   POST   /api/aisha/voice/transcribe  — STT (Whisper)
 *   POST   /api/aisha/voice/synthesize  — TTS (ElevenLabs)
 *   POST   /api/aisha/chat              — text-chat (graceful stub if no LLM key)
 *   SSE    /api/aisha/stream/:id        — streaming text deltas + tool results
 *
 * Voice and stream controllers depend on WhisperService / ElevenLabsService /
 * AishaSseGateway respectively — kept as providers so DI resolves cleanly even
 * when their underlying API keys are absent (the services themselves degrade
 * gracefully).
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AishaConfig } from './config/aisha.config';
import { WakeConfigController } from './presentation/controllers/wake-config.controller';
import { AishaChatController } from './presentation/controllers/chat.controller';
import { VoiceController } from './presentation/controllers/voice.controller';
import { AishaSseGateway } from './infrastructure/streaming/aisha-sse.gateway';
import { WhisperService } from './application/voice/whisper.service';
import { ElevenLabsService } from './application/voice/elevenlabs.service';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    EventEmitterModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    AishaConfig,
    WhisperService,
    ElevenLabsService,
  ],
  controllers: [
    WakeConfigController,
    AishaChatController,
    VoiceController,
    AishaSseGateway,
  ],
  exports: [AishaConfig],
})
export class AishaModule {}
