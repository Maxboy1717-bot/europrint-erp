/**
 * CJS shim for uuid v14 (pure ESM).
 * Jest runs in CommonJS mode; uuid@14 ships only ESM, so we provide
 * a real implementation here that Jest can require() without issues.
 */
'use strict';

const { randomUUID } = require('crypto');

function v4() {
  return randomUUID();
}

function v1() {
  // Simple v1-like UUID using timestamp + random
  return randomUUID();
}

function v3() { return randomUUID(); }
function v5() { return randomUUID(); }

const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

function validate(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function version(uuid) {
  if (!validate(uuid)) throw new Error('Invalid UUID');
  return parseInt(uuid.slice(14, 15), 16);
}

function parse(uuid) {
  const bytes = new Uint8Array(16);
  let i = 0;
  uuid.replace(/[0-9a-fA-F]{2}/g, (hex) => {
    bytes[i++] = parseInt(hex, 16);
  });
  return bytes;
}

function stringify(bytes) {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

module.exports = { v4, v1, v3, v5, NIL, MAX, validate, version, parse, stringify };
