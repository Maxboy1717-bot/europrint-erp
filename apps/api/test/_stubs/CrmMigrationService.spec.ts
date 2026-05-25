/**
 * @module CrmMigrationService.spec
 * @description Minimal contract test for CrmMigrationService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('CrmMigrationService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/infrastructure/database/crm-migration.service');
    expect(mod).toBeDefined();
    expect(mod.CrmMigrationService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/infrastructure/database/crm-migration.service');
    const b = await import('../../src/infrastructure/database/crm-migration.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/infrastructure/database/crm-migration.service');
    const exported = mod.CrmMigrationService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
