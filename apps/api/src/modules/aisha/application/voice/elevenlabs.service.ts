/**
 * @module elevenlabs.service
 * @description Streaming text-to-speech wrapper. Yields raw audio chunks
 * (MP3/PCM as configured at the voice level) so the caller can pipe to a
 * Fastify reply or WebSocket without buffering the whole file.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AishaConfig } from '../../config/aisha.config';

interface ElevenLike {
  textToSpeech: {
    convertAsStream(voiceId: string, body: Record<string, unknown>): Promise<AsyncIterable<Uint8Array>>;
  };
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private sdk: ElevenLike | null = null;

  constructor(private readonly cfg: AishaConfig) {}

  setSdkForTesting(sdk: ElevenLike): void {
    this.sdk = sdk;
  }

  private async getSdk(): Promise<ElevenLike> {
    if (this.sdk) return this.sdk;
    const mod = await import('elevenlabs');
    const ElevenLabs = (mod as unknown as {
      ElevenLabsClient: new (opts: { apiKey: string }) => ElevenLike;
    }).ElevenLabsClient;
    this.sdk = new ElevenLabs({ apiKey: this.cfg.elevenLabsKey });
    return this.sdk;
  }

  async *synthesizeStream(text: string, voiceId?: string): AsyncIterable<Uint8Array> {
    const sdk = await this.getSdk();
    const id = voiceId ?? this.cfg.elevenLabsVoiceId;
    try {
      const it = await sdk.textToSpeech.convertAsStream(id, {
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
      });
      for await (const chunk of it) yield chunk;
    } catch (err) {
      this.logger.error('ElevenLabs synthesise failed', err as Error);
      throw err;
    }
  }
}
