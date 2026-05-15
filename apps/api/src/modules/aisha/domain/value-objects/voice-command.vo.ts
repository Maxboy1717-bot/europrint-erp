/**
 * @module voice-command.vo
 * @description Immutable VO representing one recognised utterance from the
 * Director. Carries the transcript, detected language, STT confidence and
 * audio duration. Constructed via the static `create()` factory which
 * validates inputs and returns a Result.
 */

import { Result, Ok, Err, AppErr } from '@common/result';

export type VoiceLanguage = 'uz' | 'ru';

export interface VoiceCommandProps {
  transcript: string;
  language:   VoiceLanguage;
  confidence: number;
  durationMs: number;
}

export class VoiceCommand {
  private constructor(public readonly props: Readonly<VoiceCommandProps>) {}

  static create(props: VoiceCommandProps): Result<VoiceCommand> {
    if (!props.transcript || props.transcript.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'VoiceCommand: transcript bo\'sh bo\'lmasligi kerak'));
    }
    if (props.confidence < 0 || props.confidence > 1) {
      return Err(AppErr('VALIDATION', 'VoiceCommand: confidence 0..1 oralig\'ida bo\'lishi kerak'));
    }
    if (props.durationMs < 0) {
      return Err(AppErr('VALIDATION', 'VoiceCommand: durationMs manfiy bo\'lmasligi kerak'));
    }
    if (props.language !== 'uz' && props.language !== 'ru') {
      return Err(AppErr('VALIDATION', `VoiceCommand: noma'lum til "${props.language}"`));
    }
    return Ok(new VoiceCommand({ ...props, transcript: props.transcript.trim() }));
  }

  equals(other: VoiceCommand): boolean {
    return this.props.transcript === other.props.transcript
      && this.props.language === other.props.language
      && this.props.confidence === other.props.confidence
      && this.props.durationMs === other.props.durationMs;
  }
}
