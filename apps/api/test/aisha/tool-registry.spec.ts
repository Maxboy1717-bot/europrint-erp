/**
 * @module tool-registry.spec
 */

import { ToolRegistry } from '../../src/modules/aisha/application/tools/tool.registry';
import type { IAishaTool } from '../../src/modules/aisha/domain/tool.interface';
import { Ok } from '../../src/common/result';

function mkTool(name: string): IAishaTool {
  return {
    definition: {
      name,
      description: 'test',
      input_schema: { type: 'object', properties: {} },
    },
    execute: () => Promise.resolve(Ok({
      data: null,
      provenance: {
        sources: [{ type: 'database', identifier: 't', queriedAt: 'now', latencyMs: 1, freshness: 'live' }],
        confidence: 1, citations: [],
      },
    })),
  };
}

describe('ToolRegistry', () => {
  it('registers and looks up by name', () => {
    const reg = new ToolRegistry();
    reg.register(mkTool('alpha'));
    const r = reg.getToolByName('alpha');
    expect(r.ok).toBe(true);
  });

  it('returns Err for unknown name', () => {
    const reg = new ToolRegistry();
    const r = reg.getToolByName('nope');
    expect(r.ok).toBe(false);
  });

  it('rejects duplicate registration', () => {
    const reg = new ToolRegistry();
    reg.register(mkTool('x'));
    expect(() => reg.register(mkTool('x'))).toThrow(/duplicate/);
  });

  it('getDefinitions returns one entry per registered tool', () => {
    const reg = new ToolRegistry();
    reg.registerAll([mkTool('a'), mkTool('b'), mkTool('c')]);
    expect(reg.getDefinitions()).toHaveLength(3);
    expect(reg.size()).toBe(3);
  });
});
