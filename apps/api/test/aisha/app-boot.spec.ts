/**
 * @module app-boot.spec
 * @description Verifies AishaModule is wired into AppModule's imports list
 * by static inspection of the source file. We avoid actually booting the
 * full app (heavy: requires DB/Redis) — the AishaModule's own spec
 * covers compilation.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AppModule wiring', () => {
  it('imports AishaModule alongside DirectorModule', () => {
    const appModulePath = resolve(__dirname, '../../src/app.module.ts');
    const src = readFileSync(appModulePath, 'utf-8');

    expect(src).toMatch(/import\s*\{\s*AishaModule\s*\}\s*from\s*'\.\/modules\/aisha\/aisha\.module';/);
    expect(src).toMatch(/AishaModule,/);
  });
});
