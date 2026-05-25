import { ElevenLabsService } from '../../src/modules/aisha/application/voice/elevenlabs.service';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function fakeCfg(): AishaConfig {
  return { elevenLabsKey: 'k', elevenLabsVoiceId: 'v1' } as unknown as AishaConfig;
}

function chunkIter(chunks: Uint8Array[]): AsyncIterable<Uint8Array> {
  // eslint-disable-next-line @typescript-eslint/require-await
  return (async function* () { for (const c of chunks) yield c; })();
}

describe('ElevenLabsService', () => {
  it('streams chunks from the SDK', async () => {
    const svc = new ElevenLabsService(fakeCfg());
    svc.setSdkForTesting({
      textToSpeech: {
        convertAsStream: () => Promise.resolve(chunkIter([new Uint8Array([1, 2]), new Uint8Array([3])])),
      },
    });
    const out: Uint8Array[] = [];
    for await (const c of svc.synthesizeStream('hi')) out.push(c);
    expect(out).toHaveLength(2);
  });

  it('uses configured voice id by default', async () => {
    const svc = new ElevenLabsService(fakeCfg());
    let received = '';
    svc.setSdkForTesting({
      textToSpeech: {
        convertAsStream: (id: string) => { received = id; return Promise.resolve(chunkIter([])); },
      },
    });
    for await (const _ of svc.synthesizeStream('hi')) { /* drain */ }
    expect(received).toBe('v1');
  });

  it('honours overridden voice id', async () => {
    const svc = new ElevenLabsService(fakeCfg());
    let received = '';
    svc.setSdkForTesting({
      textToSpeech: {
        convertAsStream: (id: string) => { received = id; return Promise.resolve(chunkIter([])); },
      },
    });
    for await (const _ of svc.synthesizeStream('hi', 'v-custom')) { /* drain */ }
    expect(received).toBe('v-custom');
  });
});
