/**
 * @module voice-command.vo.spec
 * @description Unit tests for VoiceCommand VO.
 */

import { VoiceCommand } from '../../src/modules/aisha/domain/value-objects/voice-command.vo';

describe('VoiceCommand', () => {
  const valid = { transcript: 'hello', language: 'uz' as const, confidence: 0.9, durationMs: 1200 };

  it('creates a valid command when all inputs are sound', () => {
    const r = VoiceCommand.create(valid);
    expect(r.ok).toBe(true);
  });

  it('rejects empty transcript', () => {
    const r = VoiceCommand.create({ ...valid, transcript: '   ' });
    expect(r.ok).toBe(false);
  });

  it('rejects out-of-range confidence', () => {
    const r = VoiceCommand.create({ ...valid, confidence: 1.5 });
    expect(r.ok).toBe(false);
  });

  it('rejects negative duration', () => {
    const r = VoiceCommand.create({ ...valid, durationMs: -1 });
    expect(r.ok).toBe(false);
  });

  it('rejects unknown language', () => {
    const r = VoiceCommand.create({ ...valid, language: 'en' as unknown as 'uz' });
    expect(r.ok).toBe(false);
  });

  it('equals returns true for identical content', () => {
    const a = VoiceCommand.create(valid);
    const b = VoiceCommand.create(valid);
    if (!a.ok || !b.ok) throw new Error('setup');
    expect(a.data.equals(b.data)).toBe(true);
  });
});
