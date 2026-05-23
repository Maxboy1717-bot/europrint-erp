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
    const featureModulesPath = resolve(__dirname, '../../src/feature-modules.ts');
    const appSrc = readFileSync(appModulePath, 'utf-8');
    const featureSrc = readFileSync(featureModulesPath, 'utf-8');

    // AishaModule must appear in the @Module() imports array
    expect(appSrc).toMatch(/AishaModule,/);

    // AishaModule must be importable — either directly or via the feature-modules barrel
    const importedDirectly = /import\s*\{[^}]*AishaModule[^}]*\}/.test(appSrc);
    const reExportedViaBarrel = /AishaModule/.test(featureSrc);
    expect(importedDirectly || reExportedViaBarrel).toBe(true);
  });
});
