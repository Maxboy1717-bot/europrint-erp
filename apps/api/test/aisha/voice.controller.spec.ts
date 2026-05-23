import { VoiceController } from '../../src/modules/aisha/presentation/controllers/voice.controller';
import { WhisperService } from '../../src/modules/aisha/application/voice/whisper.service';
import { ElevenLabsService } from '../../src/modules/aisha/application/voice/elevenlabs.service';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';
import { BadRequestException } from '@nestjs/common';

function fakeCfg(): AishaConfig {
  return { openaiKey: 'k', elevenLabsKey: 'k', elevenLabsVoiceId: 'v' } as unknown as AishaConfig;
}

function fakeI18n() {
  return { t: jest.fn().mockResolvedValue('error') } as never;
}

describe('VoiceController', () => {
  it('transcribe rejects when no multipart file is present', async () => {
    const w = new WhisperService(fakeCfg());
    const e = new ElevenLabsService(fakeCfg());
    const ctrl = new VoiceController(w, e, fakeI18n());
    const req = { file: () => Promise.resolve(null) } as never;
    await expect(ctrl.transcribe(req)).rejects.toThrow(BadRequestException);
  });

  it('transcribe forwards STT result on success', async () => {
    const w = new WhisperService(fakeCfg());
    w.setSdkForTesting({
      audio: { transcriptions: { create: () => Promise.resolve({ text: 'ok', language: 'uz' }) } },
    });
    const ctrl = new VoiceController(w, new ElevenLabsService(fakeCfg()), fakeI18n());
    const req = {
      file: () => Promise.resolve({ toBuffer: () => Promise.resolve(Buffer.from('x')), mimetype: 'audio/webm' }),
    } as never;
    const r = await ctrl.transcribe(req);
    expect(r.text).toBe('ok');
  });

  it('transcribe surfaces STT errors as 400', async () => {
    const w = new WhisperService(fakeCfg());
    w.setSdkForTesting({
      audio: { transcriptions: { create: () => Promise.reject(new Error('boom')) } },
    });
    const ctrl = new VoiceController(w, new ElevenLabsService(fakeCfg()), fakeI18n());
    const req = {
      file: () => Promise.resolve({ toBuffer: () => Promise.resolve(Buffer.from('x')), mimetype: 'audio/webm' }),
    } as never;
    await expect(ctrl.transcribe(req)).rejects.toThrow(BadRequestException);
  });

  it('synthesize validates body via Zod', async () => {
    const e = new ElevenLabsService(fakeCfg());
    const ctrl = new VoiceController(new WhisperService(fakeCfg()), e, fakeI18n());
    const reply = { raw: { setHeader: () => {}, write: () => {}, end: () => {}, destroy: () => {} } } as never;
    await expect(ctrl.synthesize({ text: '' }, reply)).rejects.toThrow();
  });
});
