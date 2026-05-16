/**
 * @module gemini-fallback.service.spec
 */

import { GeminiFallbackService } from '../../src/modules/aisha/application/llm/gemini-fallback.service';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function fakeCfg(): AishaConfig {
  return { googleAiKey: 'k' } as unknown as AishaConfig;
}

describe('GeminiFallbackService', () => {
  it('returns text on success', async () => {
    const svc = new GeminiFallbackService(fakeCfg());
    svc.setSdkForTesting({
      getGenerativeModel: () => ({
        generateContent: () => Promise.resolve({ response: { text: () => 'ok' } }),
      }),
    });
    const r = await svc.generate('hi');
    expect(r.ok && r.data).toBe('ok');
  });

  it('returns Err when SDK throws', async () => {
    const svc = new GeminiFallbackService(fakeCfg());
    svc.setSdkForTesting({
      getGenerativeModel: () => ({
        generateContent: () => Promise.reject(new Error('rate-limited')),
      }),
    });
    const r = await svc.generate('hi');
    expect(r.ok).toBe(false);
  });

  it('propagates upstream error message', async () => {
    const svc = new GeminiFallbackService(fakeCfg());
    svc.setSdkForTesting({
      getGenerativeModel: () => ({
        generateContent: () => Promise.reject(new Error('quota exceeded')),
      }),
    });
    const r = await svc.generate('hi');
    if (r.ok) throw new Error('expected failure');
    expect(r.error.message).toContain('quota');
  });
});
