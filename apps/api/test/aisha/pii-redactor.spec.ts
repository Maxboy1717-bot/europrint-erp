/**
 * @module pii-redactor.spec
 */

import { redactPII, restorePII } from '../../src/modules/aisha/application/llm/pii-redactor';

describe('PII redactor', () => {
  it('redacts Uzbek phone numbers', () => {
    const { redacted } = redactPII('Telefon: +998 90 123 45 67');
    expect(redacted).not.toContain('+998');
    expect(redacted).toMatch(/\[REDACTED:phone:/);
  });

  it('redacts INN', () => {
    const { redacted } = redactPII('Tashkilot INN 123456789');
    expect(redacted).toMatch(/\[REDACTED:inn:/);
  });

  it('redacts MFO', () => {
    const { redacted } = redactPII('Bank MFO 00425');
    expect(redacted).toMatch(/\[REDACTED:mfo:/);
  });

  it('redacts passport numbers', () => {
    const { redacted } = redactPII('Pasport: AA1234567');
    expect(redacted).toMatch(/\[REDACTED:passport:/);
  });

  it('redacts salary fields', () => {
    const { redacted } = redactPII('salary 12000000');
    expect(redacted).toMatch(/\[REDACTED:salary:/);
  });

  it('redacts emails', () => {
    const { redacted } = redactPII('hr@example.com');
    expect(redacted).toMatch(/\[REDACTED:email:/);
  });

  it('restorePII inverts the redaction', () => {
    const original = 'Aloqa: +998 90 123 45 67, hr@example.com';
    const { redacted, restoreMap } = redactPII(original);
    expect(restorePII(redacted, restoreMap)).toBe(original);
  });
});
