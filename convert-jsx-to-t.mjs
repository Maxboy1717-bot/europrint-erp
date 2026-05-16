#!/usr/bin/env node
/**
 * convert-jsx-to-t.mjs — bulk rewrite hardcoded JSX strings to t('key') calls.
 *
 * For each .tsx file in the scan list:
 *   1. Find single-line >text< JSX text and prop="text" patterns.
 *   2. Filter out technical strings (code fragments, attributes, identifiers).
 *   3. For each real visible string:
 *        - Generate a stable key from the text (slugify).
 *        - Look up the file's nearest namespace (matches `useTranslation('xxx')`).
 *        - If no namespace yet, default to 'common' and inject the hook.
 *        - Add the key to UZ namespace JSON (value = original text).
 *        - Add to RU namespace JSON (value = same as UZ for now; human translates later).
 *        - Rewrite the JSX with {t('key')} (or attr={t('key')}).
 *   4. Ensure `useTranslation` import + hook call exist.
 *
 * Limitations (intentionally conservative — we don't want to break files):
 *   - Skip strings containing JS-like punctuation: <, >, =, {, }, $, `, =>
 *   - Skip strings that look like CSS units / numbers
 *   - Skip strings inside .test.tsx / .spec.tsx
 *   - Skip strings shorter than 4 chars or single ascii words shorter than 8 chars
 *   - Skip if the file is in pure-UI primitives (components/ui/*)
 *   - Skip multi-line JSX text (regex requires no newlines)
 *
 * Result: produces a CHANGELOG of (file, before, after) plus updated UZ/RU
 * JSON files. Run with --dry to preview only.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DRY    = process.argv.includes('--dry');
const ROOT   = 'artifacts/erp-dashboard/src';
const UZ_DIR = `${ROOT}/locales/uz`;
const RU_DIR = `${ROOT}/locales/ru`;

// Files to skip — UI primitives that often contain demo strings or are vendor.
const SKIP_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /components\/ui\//,
  /\.d\.ts$/,
  /\/__tests__\//,
  /\/__mocks__\//,
];

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
}

// Slugify text into a camelCase i18n key, max 50 chars.
function makeKey(text) {
  const cleaned = text
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  if (cleaned.length === 0) return 'untitled';
  const head = cleaned[0].toLowerCase();
  const tail = cleaned.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  let key = head + tail;
  if (/^[0-9]/.test(key)) key = 'k' + key;
  return key.slice(0, 50);
}

// Detect whether a captured string is "real visible text" worth translating.
function isRealText(raw) {
  if (raw.length < 4) return false;
  if (/[<>={}$`]|=>/.test(raw)) return false;
  // Pure numeric / unit
  if (/^[\d\s.,:%/$\-+()_xX*&|=<>!?[\]]+$/.test(raw)) return false;
  // Pure ASCII identifier
  if (/^[a-z][a-zA-Z0-9]*$/.test(raw) && raw.length < 12) return false;
  // SHOUTING ENUM
  if (/^[A-Z][A-Z0-9_|/]+$/.test(raw)) return false;
  // Must have at least one letter
  if (!/[A-Za-zА-Яа-яЀ-ӿ]/.test(raw)) return false;
  // Must have a space (multi-word) OR contain at least 4 letters
  const letters = (raw.match(/[A-Za-zА-Яа-яЀ-ӿ]/g) || []).length;
  if (!/\s/.test(raw) && letters < 6) return false;
  // Common technical noise
  if (/className|onClick|onChange|style=|href=|src=/.test(raw)) return false;
  if (/^(true|false|null|undefined|loading|disabled|active|inactive)$/i.test(raw)) return false;
  // CSS units after a number
  if (/^\d+(\.\d+)?\s*(px|rem|em|%|s|ms|fr|vh|vw|deg)$/.test(raw)) return false;
  return true;
}

// Walk the file and return findings; we use simple line-based regex passes
// because TSX is too complex for a regex-only parser to cover every case.
// Stricter JSX text matcher: the captured text MUST be between a real
// JSX element opening (`<TagName …>`) and a real closing tag (`</TagName>`)
// on the SAME line. This avoids matching across TypeScript generics like
// `Record<string, unknown>` or arrow functions `(d => …)`.
const RE_JSX_TEXT  = /(<[A-Za-z][\w.-]*(?:\s+[^<>{}\n\r]*?)?>)([^<>{}\n\r]{3,}?)(<\/[A-Za-z][\w.-]*>)/g;
// Attr regex: match same quote on both ends, no newline. Skip values that
// embed the same quote character (we can't handle escape-aware parsing here).
const RE_PLACEHOLDER_D = /(\bplaceholder)="([^"\n\r]{3,})"/g;
const RE_PLACEHOLDER_S = /(\bplaceholder)='([^'\n\r]{3,})'/g;
const RE_TITLE_ATTR_D  = /(\btitle)="([^"\n\r]{3,})"/g;
const RE_TITLE_ATTR_S  = /(\btitle)='([^'\n\r]{3,})'/g;
const RE_ARIA_LABEL_D  = /(\baria-label)="([^"\n\r]{3,})"/g;
const RE_ARIA_LABEL_S  = /(\baria-label)='([^'\n\r]{3,})'/g;

// Detect existing namespace used in file
function detectNamespace(src) {
  const m = src.match(/useTranslation\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/);
  return m ? m[1] : null;
}

function ensureUseTranslationImport(src, ns) {
  let out = src;

  // If file already has `t` as a function-local variable or prop (e.g. signature
  // `({ t }: Props)`, or `t: (key: string) => string`), don't add another hook —
  // the parent already passes it down. We still need to ensure the import isn't
  // duplicated; just bail out entirely.
  const tIsProp =
    /function\s+\w+\s*\([^)]*\{\s*[^}]*\bt\b/.test(out)
    || /\bt\s*:\s*\(\s*\w+\s*:\s*string\s*\)\s*=>\s*string/.test(out);

  if (tIsProp) return out;

  if (!/from\s+['"]@\/lib\/i18n['"]/.test(out)) {
    // Find the end of the LAST import statement (after its terminating `;`),
    // not the start of the next line — so we don't drop the new import in the
    // middle of a multi-line `import { … } from 'pkg'` statement.
    const importRe = /^import[\s\S]*?;\s*$/gm;
    let lastEnd = -1;
    let im;
    while ((im = importRe.exec(out))) {
      lastEnd = im.index + im[0].length;
    }
    if (lastEnd > 0) {
      out = out.slice(0, lastEnd) + `\nimport { useTranslation } from '@/lib/i18n';` + out.slice(lastEnd);
    } else {
      out = `import { useTranslation } from '@/lib/i18n';\n` + out;
    }
  }
  // Ensure const { t } = useTranslation(ns) is inside the first React component.
  // Skip injection only if the file already destructures `t` from useTranslation;
  // otherwise we need to add the hook call.
  if (/const\s*\{\s*t\s*[,}].*useTranslation\s*\(/s.test(out)
   || /const\s*\{\s*t\s*[,}]/.test(out)) {
    return out; // already destructured somewhere
  }
  out = out.replace(
    /(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)/,
    `$1\n  const { t } = useTranslation('${ns}');`,
  );
  return out;
}

// Apply edits LR (left to right) and adjust offsets carefully.
function rewriteFile(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const namespaceFromFile = detectNamespace(src);
  // Choose namespace: existing > 'common'
  const ns = namespaceFromFile ?? 'common';

  const edits = []; // {start, end, replacement, text, key}
  const seenKeys = new Set();

  const addEdit = (start, end, raw, attrName) => {
    const text = raw.trim();
    if (!isRealText(text)) return;
    // Generate a deterministic key
    let key = makeKey(text);
    let final = key, n = 2;
    while (seenKeys.has(final)) { final = key + n; n++; }
    seenKeys.add(final);
    if (attrName) {
      edits.push({ start, end, replacement: `${attrName}={t(${JSON.stringify(final)})}`, text, key: final });
    }
  };

  // For JSX text: replace ONLY the inner-text portion between an opening and
  // closing tag. We do NOT touch the tags themselves.
  const addEditTextSlice = (start, end, raw) => {
    const text = raw.trim();
    if (!isRealText(text)) return;
    let key = makeKey(text);
    let final = key, n = 2;
    while (seenKeys.has(final)) { final = key + n; n++; }
    seenKeys.add(final);
    edits.push({ start, end, replacement: `{t(${JSON.stringify(final)})}`, text, key: final });
  };

  // For JSX text, we matched a 3-group pattern: opening tag + text + closing tag.
  // We only replace the TEXT portion; opening and closing tags remain intact.
  RE_JSX_TEXT.lastIndex = 0;
  let mJsx;
  while ((mJsx = RE_JSX_TEXT.exec(src))) {
    const openTag  = mJsx[1];
    const textRaw  = mJsx[2];
    const closeTag = mJsx[3];
    const textStartIdx = mJsx.index + openTag.length;
    const textEndIdx   = textStartIdx + textRaw.length;
    addEditTextSlice(textStartIdx, textEndIdx, textRaw);
  }
  for (const reLocal of [
    RE_PLACEHOLDER_D, RE_PLACEHOLDER_S,
    RE_TITLE_ATTR_D,  RE_TITLE_ATTR_S,
    RE_ARIA_LABEL_D,  RE_ARIA_LABEL_S,
  ]) {
    reLocal.lastIndex = 0;
    let m;
    while ((m = reLocal.exec(src))) {
      const fullStart = m.index;
      const fullEnd = m.index + m[0].length;
      const attr = m[1];
      const raw = m[2];
      // Skip if the value contains React expression syntax leftovers
      if (/[<>{}$`]/.test(raw)) continue;
      addEdit(fullStart, fullEnd, raw, attr);
    }
  }

  if (edits.length === 0) return { edits: 0, keys: [], src };

  // Apply edits right-to-left
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);

  // Make sure useTranslation is imported and the hook is called
  out = ensureUseTranslationImport(out, ns);

  return { edits: edits.length, keys: edits.map((e) => ({ key: e.key, text: e.text })), src: out, ns };
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && /\.(tsx|jsx)$/.test(e.name) && !shouldSkip(full)) {
      yield full;
    }
  }
}

// Load and update locale JSON files
function loadJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return {}; }
}
function saveJson(p, obj) {
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

// Limit run to specific scan dirs to keep blast radius controlled.
const SCAN = (process.argv[2] && !process.argv[2].startsWith('--'))
  ? [process.argv[2]]
  : ['pages', 'components/hr', 'components/recruiting', 'components/wms',
     'components/employee', 'camera-ai-modern'];

const newKeys = {}; // { namespace: { key: text } }
let filesTouched = 0;
let totalEdits = 0;

for (const sub of SCAN) {
  const root = join(ROOT, sub);
  if (!existsSync(root)) continue;
  for (const f of walk(root)) {
    const r = rewriteFile(f);
    if (r.edits === 0) continue;
    totalEdits += r.edits;
    filesTouched++;
    const ns = r.ns ?? 'common';
    newKeys[ns] ||= {};
    for (const { key, text } of r.keys) {
      newKeys[ns][key] = text;
    }
    if (!DRY) writeFileSync(f, r.src);
    if (filesTouched % 20 === 0) process.stdout.write(`  ${filesTouched} files processed (${totalEdits} edits)\n`);
  }
}

console.log(`\nFiles touched:  ${filesTouched}`);
console.log(`Total edits:    ${totalEdits}`);
console.log(`Namespaces hit: ${Object.keys(newKeys).length}`);

if (!DRY) {
  // Merge into UZ + RU JSON; RU gets the same value as UZ for now (manual translation later).
  for (const [ns, keys] of Object.entries(newKeys)) {
    const uzP = `${UZ_DIR}/${ns}.json`;
    const ruP = `${RU_DIR}/${ns}.json`;
    const uz = loadJson(uzP);
    const ru = loadJson(ruP);
    let addedUz = 0, addedRu = 0;
    for (const [key, text] of Object.entries(keys)) {
      if (!(key in uz)) { uz[key] = text; addedUz++; }
      if (!(key in ru)) { ru[key] = text; addedRu++; }
    }
    if (addedUz > 0 || addedRu > 0) {
      saveJson(uzP, uz);
      saveJson(ruP, ru);
      console.log(`  ${ns}.json  +${addedUz} UZ, +${addedRu} RU`);
    }
  }
}
