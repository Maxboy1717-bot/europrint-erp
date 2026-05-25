/**
 * @module sse-gateway.spec
 */

import { firstValueFrom, take, toArray } from 'rxjs';
import { AishaSseGateway } from '../../src/modules/aisha/infrastructure/streaming/aisha-sse.gateway';

describe('AishaSseGateway', () => {
  it('opens a new stream per conversation id', () => {
    const gw = new AishaSseGateway();
    gw.stream('c1');
    expect(gw.activeStreams()).toBe(1);
  });

  it('push forwards text_delta to the observer', async () => {
    const gw = new AishaSseGateway();
    const obs = gw.stream('c1');
    const collected = firstValueFrom(obs.pipe(take(1), toArray()));
    gw.push('c1', { kind: 'text_delta', text: 'hi' });
    const events = await collected;
    expect(events[0].data).toMatchObject({ kind: 'text_delta', text: 'hi' });
  });

  it('completes and unregisters stream on done', async () => {
    const gw = new AishaSseGateway();
    gw.stream('c1');
    gw.push('c1', { kind: 'done', stopReason: 'end_turn' });
    expect(gw.activeStreams()).toBe(0);
  });

  it('push to unknown conversation is a no-op', () => {
    const gw = new AishaSseGateway();
    expect(() => gw.push('nope', { kind: 'text_delta', text: 'x' })).not.toThrow();
  });
});
