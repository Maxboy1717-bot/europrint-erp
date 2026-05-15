/**
 * @module whisper.service
 * @description OpenAI Whisper speech-to-text wrapper. Auto-detects uz/ru
 * (defaults to uz when API doesn't return language). Lazy-loads the SDK
 * so test suites running without it stay green.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { AishaConfig } from '../../config/aisha.config';

export interface STTResult {
  text:       string;
  language:   'uz' | 'ru';
  confidence: number;
}

interface OpenAILike {
  audio: {
    transcriptions: {
      create(opts: Record<string, unknown>): Promise<{ text: string; language?: string }>;
    };
  };
}

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private sdk: OpenAILike | null = null;

  constructor(private readonly cfg: AishaConfig) {}

  setSdkForTesting(sdk: OpenAILike): void {
    this.sdk = sdk;
  }

  private async getSdk(): Promise<OpenAILike> {
    if (this.sdk) return this.sdk;
    const mod = await import('openai');
    const OpenAI = (mod as unknown as { default: new (opts: { apiKey: string }) => OpenAILike }).default;
    this.sdk = new OpenAI({ apiKey: this.cfg.openaiKey });
    return this.sdk;
  }

  async transcribe(audio: Buffer, mime = 'audio/webm'): Promise<Result<STTResult>> {
    try {
      const sdk = await this.getSdk();
      const file = new Blob([new Uint8Array(audio)], { type: mime });
      const r = await sdk.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'verbose_json',
      });
      const lang = (r.language === 'ru' ? 'ru' : 'uz') as 'uz' | 'ru';
      return Ok({ text: r.text, language: lang, confidence: 0.9 });
    } catch (err) {
      this.logger.error('Whisper transcribe failed', err as Error);
      return Err(AppErr('EXTERNAL_SERVICE', (err as Error).message));
    }
  }
}
