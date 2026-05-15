#!/usr/bin/env node
/**
 * fix-eperrorstate-error-prop.mjs — propagate the React Query error object
 * into <EPErrorState onRetry={refetch} /> so the new 501 / 4xx / 5xx
 * description logic in EPErrorState can run.
 *
 *   Anti-pattern (what we have):
 *     const { data, isError, refetch } = useQuery({ queryKey: [URL] });
 *     if (isError) return <EPErrorState onRetry={refetch} />;
 *
 *   Fixed:
 *     const { data, isError, error, refetch } = useQuery({ queryKey: [URL] });
 *     if (isError) return <EPErrorState onRetry={refetch} error={error} />;
 *
 * If `error` is already destructured, just add the prop.
 * If the destructure doesn't have `isError`, skip (page handles errors differently).
 *
 * Limits:
 *   - Only touches files under artifacts/erp-dashboard/src
 *   - Skips files that have NO `<EPErrorState onRetry=` occurrence
 *   - Idempotent — already-fixed files are no-ops
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'artifacts/erp-dashboard/src';
const exts = ['.tsx', '.ts'];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (exts.includes(path.extname(name))) acc.push(full);
  }
  return acc;
}

const files = walk(ROOT);
let touched = 0;
let propsAdded = 0;
let destructuresExtended = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('<EPErrorState onRetry=')) continue;

  const before = content;

  // ── Step 1: extend useQuery destructures that have isError but no error.
  // Pattern: `const { ..., isError, ..., refetch } = useQuery(`
  // We rewrite to add `error` after `isError` if not already present.
  content = content.replace(
    /const\s*\{\s*([^}]+?)\s*\}\s*=\s*useQuery\b/g,
    (match, destructure) => {
      // Skip if `error` is already destructured (with or without rename).
      // Match: bare "error", "error:", or ",error" anywhere in the destructure.
      if (/\berror\s*[,:}]/.test(destructure + '}')) return match;
      // Skip if `isError` is missing — page does not use the error flag.
      if (!/\bisError\b/.test(destructure)) return match;
      destructuresExtended++;
      // Insert `error` right after `isError` (preserving any rename of isError).
      const updated = destructure.replace(/\bisError\b/, 'isError, error');
      return match.replace(destructure, updated);
    },
  );

  // ── Step 2: add `error={error}` prop to any <EPErrorState onRetry={X} />
  // (but only if it doesn't already have an `error=` attribute).
  // Self-closing tags only — multiline ones we leave alone.
  content = content.replace(
    /<EPErrorState\b([^/>]*?)\/>/g,
    (match, attrs) => {
      if (/\berror\s*=/.test(attrs)) return match;          // already has error prop
      if (!/\bonRetry\s*=/.test(attrs)) return match;       // no retry → may be a stub usage we shouldn't touch
      propsAdded++;
      // Insert `error={error}` before the closing `/>`.
      return `<EPErrorState${attrs} error={error} />`;
    },
  );

  if (content !== before) {
    fs.writeFileSync(f, content);
    touched++;
  }
}

console.log(`Files touched:           ${touched}`);
console.log(`Destructures extended:   ${destructuresExtended}`);
console.log(`error props added:       ${propsAdded}`);
