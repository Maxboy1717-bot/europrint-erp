/**
 * @module tool-call.vo.spec
 * @description ToolCall VO invariants — provenance is mandatory.
 */

import { ToolCall, type Provenance } from '../../src/modules/aisha/domain/value-objects/tool-call.vo';

const okProv: Provenance = {
  sources: [{
    type: 'database', identifier: 'sd.sales_orders',
    queriedAt: new Date().toISOString(), latencyMs: 12, freshness: 'live',
  }],
  confidence: 0.95,
  citations: [{ label: 'SO-1' }],
};

describe('ToolCall', () => {
  it('creates a valid ToolCall when all fields present', () => {
    const r = ToolCall.create({ toolName: 'get_orders', input: {}, output: [], provenance: okProv });
    expect(r.ok).toBe(true);
  });

  it('rejects empty toolName', () => {
    const r = ToolCall.create({ toolName: '', input: {}, output: [], provenance: okProv });
    expect(r.ok).toBe(false);
  });

  it('rejects missing provenance', () => {
    const r = ToolCall.create({ toolName: 'x', input: {}, output: [], provenance: undefined as unknown as Provenance });
    expect(r.ok).toBe(false);
  });

  it('rejects empty source list', () => {
    const r = ToolCall.create({
      toolName: 'x', input: {}, output: [],
      provenance: { ...okProv, sources: [] },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects out-of-range confidence', () => {
    const r = ToolCall.create({
      toolName: 'x', input: {}, output: [],
      provenance: { ...okProv, confidence: 2 },
    });
    expect(r.ok).toBe(false);
  });
});
