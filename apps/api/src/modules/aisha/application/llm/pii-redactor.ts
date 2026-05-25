/**
 * @module pii-redactor
 * @description Two-way PII shielding for LLM prompts. Replaces sensitive
 * patterns with `[REDACTED:type:N]` tokens before sending to the LLM and
 * substitutes them back in the response so the Director sees the real
 * values but the upstream provider never does.
 */

export interface RedactionMap {
  redacted: string;
  restoreMap: Record<string, string>;
}

interface RedactionRule {
  label: string;
  rx:    RegExp;
}

const RULES: RedactionRule[] = [
  { label: 'phone',    rx: /\+?998[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g },
  { label: 'inn',      rx: /\bINN[:#\s]*\d{9}\b/gi },
  { label: 'mfo',      rx: /\bMFO[:#\s]*\d{5}\b/gi },
  { label: 'passport', rx: /\b[A-Z]{2}\d{7}\b/g },
  { label: 'salary',   rx: /\bsalary[:\s]+\d+(?:[.,]\d+)?\b/gi },
  { label: 'iban',     rx: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
  { label: 'email',    rx: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi },
];

export function redactPII(input: string): RedactionMap {
  let redacted = input;
  const restoreMap: Record<string, string> = {};
  let counter = 0;

  for (const rule of RULES) {
    redacted = redacted.replace(rule.rx, (match) => {
      const token = `[REDACTED:${rule.label}:${counter++}]`;
      restoreMap[token] = match;
      return token;
    });
  }
  return { redacted, restoreMap };
}

export function restorePII(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [token, original] of Object.entries(map)) {
    out = out.split(token).join(original);
  }
  return out;
}
