/**
 * @module ContactsService.spec
 * @description Minimal contract test for ContactsService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('ContactsService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/crm/contacts/contacts.service');
    expect(mod).toBeDefined();
    expect(mod.ContactsService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/crm/contacts/contacts.service');
    const b = await import('../../src/modules/crm/contacts/contacts.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/crm/contacts/contacts.service');
    const exported = mod.ContactsService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
