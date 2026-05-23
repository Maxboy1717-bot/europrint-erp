/**
 * @module safe-uuid
 * @description Crypto-secure UUID v4 generator that works in BOTH secure
 *   (https / localhost) and non-secure contexts (http://192.168.x.y).
 *
 *   `crypto.randomUUID()` requires a secure context — browsers throw
 *   "TypeError: crypto.randomUUID is not a function" on plain HTTP.
 *   `crypto.getRandomValues()` is always available (no secure-context gate),
 *   so we fall back to it when needed.
 */

export function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 v4 fallback using crypto.getRandomValues (universally available)
  const buf = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 16; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
  buf[8] = (buf[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
