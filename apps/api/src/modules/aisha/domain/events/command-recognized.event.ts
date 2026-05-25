/**
 * @module command-recognized.event
 * @description Emitted right after Whisper returns a transcript. Carries the
 * VoiceCommand so subscribers can log / index it without re-running STT.
 */

import type { VoiceCommand } from '../value-objects/voice-command.vo';

export class CommandRecognizedEvent {
  static readonly NAME = 'aisha.command.recognized';
  constructor(
    public readonly conversationId: string,
    public readonly command: VoiceCommand,
  ) {}
}
