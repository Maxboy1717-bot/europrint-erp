#!/usr/bin/env node
/**
 * audit-hardcoded-strings.mjs — find JSX text content that isn't going through
 * useTranslation. Catches both English and Uzbek hardcoded strings that
 * should be translation keys.
 *
 * Patterns detected:
 *   1.  >Text content<                              JSX text between tags
 *   2.  placeholder="text"                          form placeholders
 *   3.  title="text"                                tooltip / a11y
 *   4.  label="text"                                form labels
 *   5.  alt="text"                                  image alt
 *   6.  aria-label="text"                           screen reader
 *
 * Skip:
 *   - Strings that look like classNames, paths, urls, css, technical tokens
 *   - Single chars, numbers, dates, codes (BOM-123, etc.)
 *   - Files inside __tests__, .test.*, .spec.*
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'artifacts/erp-dashboard/src';
const SCAN_DIRS = ['pages', 'components', 'camera-ai-modern', 'aisha'];
const SKIP_DIR = new Set(['__tests__', '__mocks__', 'test', 'tests']);

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && /\.(tsx|jsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) {
      yield full;
    }
  }
}

// Single-line JSX text: capture content between `>` and `<` that contains NO
// newline, `{`, `}`, `<`, `>` — i.e. literal visible text on one line.
const RE_JSX_TEXT = />([^<>{}\n\r]{3,}?)</g;
const RE_PLACEHOLDER = /\bplaceholder=["']([^"']{3,})["']/g;
const RE_TITLE = /\btitle=["']([^"']{3,})["']/g;
const RE_LABEL = /\blabel=["']([^"']{3,})["']/g;
const RE_ALT = /\balt=["']([^"']{3,})["']/g;
const RE_ARIA = /\baria-label=["']([^"']{3,})["']/g;

// Definitely-not-translation noise.
const TECHNICAL_RE = /^\s*[\d.,:%/$\-+()_xX*&|=<>!?[\]]+\s*$|^\s*\w+:\w+|^\s*[a-z\-_]+$|^\s*\w+\(.*\)\s*$|^\s*\$\{|className|on[A-Z]/;
// JSX expressions like {t('foo')} are fine
const TEMPLATE_RE = /\{[^}]*\}/;
// Common non-text tokens that pollute extraction
const NOISE = /^(true|false|null|undefined|loading|spinning|className|style|data-|aria-|role|key|id|type|value|onClick|onChange|href|src)/i;

const results = [];

for (const dir of SCAN_DIRS) {
  const root = join(ROOT, dir);
  try { statSync(root); } catch { continue; }
  for (const f of walk(root)) {
    const src = readFileSync(f, 'utf-8');
    // Skip files that already heavily use t(...) — they are intentional, the
    // tail of any audit would just be remnants.
    const usesT = (src.match(/\bt\(['"`]/g) || []).length;
    const findings = [];

    const tryRegex = (re, kind) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        const raw = m[1].trim();
        if (raw.length < 3) continue;
        if (TECHNICAL_RE.test(raw)) continue;
        if (TEMPLATE_RE.test(raw)) continue;          // contains {expr} — likely interpolated
        if (NOISE.test(raw)) continue;
        if (/^[A-Z_][A-Z0-9_]+$/.test(raw)) continue; // ENUM_CONSTANT
        if (/^[a-z][a-zA-Z0-9]*$/.test(raw) && raw.length < 12) continue; // camelCase identifier
        if (/^\d+(\.\d+)?\s*(px|rem|em|%|s|ms|fr|vh|vw)?$/.test(raw)) continue; // css unit
        // Tokens like  ALL_CAPS|with|pipes
        if (/^[A-Z][A-Z_|/]+$/.test(raw)) continue;
        // Must contain at least one letter; pure punctuation/numbers excluded
        if (!/[A-Za-zА-Яа-яЀ-ӿ]/.test(raw)) continue;
        // Must contain a space OR be ≥6 letters — otherwise it's likely a token
        const letters = (raw.match(/[A-Za-zА-Яа-яЀ-ӿ]/g) || []).length;
        if (!/\s/.test(raw) && letters < 6) continue;
        // Skip code-fragment giveaways: TS generics, JS syntax tokens
        if (/[<>=]|=>|\?\?|::|`/.test(raw)) continue;
        if (/\bconst |\blet |\bvar |\breturn |\bcase |\bif \(|\bswitch /.test(raw)) continue;
        // line number
        const line = src.slice(0, m.index).split('\n').length;
        findings.push({ kind, line, text: raw.length > 80 ? raw.slice(0, 80) + '…' : raw });
      }
    };

    tryRegex(RE_JSX_TEXT, 'jsx');
    tryRegex(RE_PLACEHOLDER, 'placeholder');
    tryRegex(RE_TITLE, 'title');
    tryRegex(RE_LABEL, 'label');
    tryRegex(RE_ALT, 'alt');
    tryRegex(RE_ARIA, 'aria-label');

    if (findings.length > 0) {
      results.push({
        file: f.replace(/^artifacts\/erp-dashboard\/src\//, ''),
        usesT,
        count: findings.length,
        samples: findings.slice(0, 8),
      });
    }
  }
}

// Sort by hardcoded count descending
results.sort((a, b) => b.count - a.count);

const total = results.reduce((s, r) => s + r.count, 0);
console.log(`Files with hardcoded JSX strings: ${results.length}`);
console.log(`Total hardcoded findings: ${total}`);
console.log();
console.log('━━ Top 20 worst files ━━');
for (const r of results.slice(0, 20)) {
  console.log(`  ${r.count.toString().padStart(4)}  ${r.file}  (usesT=${r.usesT})`);
}
console.log();
console.log('━━ Sample findings (top 30) ━━');
let shown = 0;
outer: for (const r of results.slice(0, 10)) {
  console.log(`\n→ ${r.file}`);
  for (const s of r.samples) {
    console.log(`   :${s.line}  [${s.kind}]  ${JSON.stringify(s.text)}`);
    shown++;
    if (shown >= 30) break outer;
  }
}

writeFileSync('audit-hardcoded-report.json', JSON.stringify(results, null, 2));
console.log('\nReport: audit-hardcoded-report.json');
