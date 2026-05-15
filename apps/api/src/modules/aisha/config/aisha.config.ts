/**
 * @module aisha.config
 * @description Centralised access to AIsha-related environment variables.
 *
 * Keys are OPTIONAL — if absent the AIsha voice assistant is simply disabled
 * (graceful degradation). Services using these keys MUST check
 * `isFullyConfigured()` (or the per-provider getters) before calling out.
 *
 * This matches the contract in `.env.production.example`:
 *   # ── OPTIONAL: AI provider keys (graceful degradation if absent) ──
 *   ANTHROPIC_API_KEY=
 *   OPENAI_API_KEY=
 *   GOOGLE_API_KEY=
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AishaConfig {
  private readonly logger = new Logger(AishaConfig.name);

  readonly anthropicKey:    string;
  readonly openaiKey:       string;
  readonly elevenLabsKey:   string;
  readonly elevenLabsVoiceId: string;
  readonly picovoiceKey:    string;
  readonly googleAiKey:     string;
  readonly directorUserId:  number;
  readonly wakeSensitivity: number;
  readonly dailyBudgetUSD:  number;
  readonly audioRetentionMinutes: number;

  constructor(private readonly cfg: ConfigService) {
    this.anthropicKey    = this.optionalKey('ANTHROPIC_API_KEY');
    this.openaiKey       = this.optionalKey('OPENAI_API_KEY');
    this.elevenLabsKey   = this.optionalKey('ELEVENLABS_API_KEY');
    this.elevenLabsVoiceId = this.optionalKey('ELEVENLABS_VOICE_ID');
    this.picovoiceKey    = this.optionalKey('PICOVOICE_ACCESS_KEY');
    this.googleAiKey     = this.optionalKey('GOOGLE_AI_API_KEY');
    this.directorUserId  = parseInt(this.optionalKey('AISHA_DIRECTOR_USER_ID') || '0', 10);
    this.wakeSensitivity = parseFloat(this.cfg.get<string>('AISHA_WAKE_SENSITIVITY') ?? '0.7');
    this.dailyBudgetUSD  = parseFloat(this.cfg.get<string>('AISHA_DAILY_BUDGET_USD') ?? '5');
    this.audioRetentionMinutes = parseInt(
      this.cfg.get<string>('AISHA_AUDIO_RETENTION_MINUTES') ?? '3',
      10,
    );

    if (!this.isFullyConfigured()) {
      const missing = this.missingKeys().join(', ');
      this.logger.warn(
        `AishaConfig: voice assistant disabled — missing env vars: ${missing}. ` +
        `Set them in /etc/europrint.env to enable.`,
      );
    } else {
      this.logger.log('AishaConfig initialised — voice assistant enabled');
    }
  }

  /** True if every key required for the full voice pipeline is present. */
  isFullyConfigured(): boolean {
    return this.missingKeys().length === 0;
  }

  /** Names of env vars that are still empty. */
  missingKeys(): string[] {
    const required: Array<[string, string]> = [
      ['ANTHROPIC_API_KEY',      this.anthropicKey],
      ['OPENAI_API_KEY',         this.openaiKey],
      ['ELEVENLABS_API_KEY',     this.elevenLabsKey],
      ['ELEVENLABS_VOICE_ID',    this.elevenLabsVoiceId],
      ['PICOVOICE_ACCESS_KEY',   this.picovoiceKey],
      ['GOOGLE_AI_API_KEY',      this.googleAiKey],
      ['AISHA_DIRECTOR_USER_ID', this.directorUserId > 0 ? 'set' : ''],
    ];
    return required.filter(([, v]) => !v).map(([k]) => k);
  }

  private optionalKey(name: string): string {
    const v = this.cfg.get<string>(name);
    return v && v.trim().length > 0 ? v : '';
  }
}
