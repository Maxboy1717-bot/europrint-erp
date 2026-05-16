/**
 * @module claude.service.spec
 * @description Mocked Claude SDK exercises stream event mapping.
 */

import { ClaudeService, type StreamEvent } from '../../src/modules/aisha/application/llm/claude.service';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function fakeSdk(events: Array<Record<string, unknown>>) {
  return {
    messages: {
      // eslint-disable-next-line @typescript-eslint/require-await
      async *stream() {
        for (const ev of events) yield ev;
      },
    },
  };
}

function fakeCfg(): AishaConfig {
  return { anthropicKey: 'k' } as unknown as AishaConfig;
}

async function collect(it: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const ev of it) out.push(ev);
  return out;
}

describe('ClaudeService', () => {
  it('emits text_delta events from content_block_delta', async () => {
    const svc = new ClaudeService(fakeCfg());
    svc.setSdkForTesting(fakeSdk([
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'hello' } },
      { type: 'message_stop' },
    ]));
    const events = await collect(svc.streamWithTools({ messages: [] }));
    expect(events[0]).toEqual({ kind: 'text_delta', text: 'hello' });
    expect(events.at(-1)?.kind).toBe('done');
  });

  it('emits tool_use events from content_block_start', async () => {
    const svc = new ClaudeService(fakeCfg());
    svc.setSdkForTesting(fakeSdk([
      { type: 'content_block_start', content_block: { type: 'tool_use', id: 't1', name: 'get_x', input: { a: 1 } } },
      { type: 'message_stop' },
    ]));
    const events = await collect(svc.streamWithTools({ messages: [] }));
    expect(events[0]).toMatchObject({ kind: 'tool_use', name: 'get_x' });
  });

  it('sendOneShot concatenates text deltas', async () => {
    const svc = new ClaudeService(fakeCfg());
    svc.setSdkForTesting(fakeSdk([
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'foo ' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'bar' } },
      { type: 'message_stop' },
    ]));
    const r = await svc.sendOneShot({ messages: [] });
    expect(r.ok && r.data).toBe('foo bar');
  });

  it('reports error when SDK throws', async () => {
    const svc = new ClaudeService(fakeCfg());
    svc.setSdkForTesting({
      messages: {
        // eslint-disable-next-line @typescript-eslint/require-await
        async *stream() { throw new Error('boom'); },
      },
    });
    const events = await collect(svc.streamWithTools({ messages: [] }));
    expect(events[0].kind).toBe('error');
  });

  it('ignores unrelated event types', async () => {
    const svc = new ClaudeService(fakeCfg());
    svc.setSdkForTesting(fakeSdk([
      { type: 'unknown_event' },
      { type: 'message_stop' },
    ]));
    const events = await collect(svc.streamWithTools({ messages: [] }));
    expect(events.find(e => e.kind === 'text_delta')).toBeUndefined();
  });
});
