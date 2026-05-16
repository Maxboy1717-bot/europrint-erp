import { WhisperService } from '../../src/modules/aisha/application/voice/whisper.service';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function fakeCfg(): AishaConfig {
  return { openaiKey: 'k' } as unknown as AishaConfig;
}

describe('WhisperService', () => {
  it('returns Ok with text/language on success', async () => {
    const svc = new WhisperService(fakeCfg());
    svc.setSdkForTesting({
      audio: { transcriptions: { create: () => Promise.resolve({ text: 'salom', language: 'uz' }) } },
    });
    const r = await svc.transcribe(Buffer.from('x'));
    expect(r.ok && r.data.text).toBe('salom');
    expect(r.ok && r.data.language).toBe('uz');
  });

  it('defaults to uz when no language returned', async () => {
    const svc = new WhisperService(fakeCfg());
    svc.setSdkForTesting({
      audio: { transcriptions: { create: () => Promise.resolve({ text: 'x' }) } },
    });
    const r = await svc.transcribe(Buffer.from('x'));
    expect(r.ok && r.data.language).toBe('uz');
  });

  it('detects ru when API returns ru', async () => {
    const svc = new WhisperService(fakeCfg());
    svc.setSdkForTesting({
      audio: { transcriptions: { create: () => Promise.resolve({ text: 'привет', language: 'ru' }) } },
    });
    const r = await svc.transcribe(Buffer.from('x'));
    expect(r.ok && r.data.language).toBe('ru');
  });

  it('returns Err when SDK throws', async () => {
    const svc = new WhisperService(fakeCfg());
    svc.setSdkForTesting({
      audio: { transcriptions: { create: () => Promise.reject(new Error('timeout')) } },
    });
    const r = await svc.transcribe(Buffer.from('x'));
    expect(r.ok).toBe(false);
  });
});
