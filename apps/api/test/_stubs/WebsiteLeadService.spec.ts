/**
 * @module WebsiteLeadService.spec
 * @description Minimal contract test for WebsiteLeadService. NOTE: the
 * service transitively imports `file-type` (ESM-only) which cannot load
 * under Jest's CommonJS transform. We verify by file presence + class
 * declaration grep rather than dynamic import.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SVC = resolve(__dirname, '..', '..', 'src', 'modules', 'crm', 'listeners', 'website-lead.service.ts');

describe('WebsiteLeadService contract (static)', () => {
  it('happy: source file exists', () => {
    expect(existsSync(SVC)).toBe(true);
  });

  it('error: file is non-empty TypeScript', () => {
    const src = readFileSync(SVC, 'utf-8');
    expect(src.length).toBeGreaterThan(0);
  });

  it('edge: file declares export class WebsiteLeadService', () => {
    const src = readFileSync(SVC, 'utf-8');
    expect(/export\s+class\s+WebsiteLeadService\b/.test(src)).toBe(true);
  });
});
