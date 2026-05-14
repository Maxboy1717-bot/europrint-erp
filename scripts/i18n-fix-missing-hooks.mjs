#!/usr/bin/env node
/**
 * Fix functions that call t() but don't have their own useTranslation hook.
 *
 * The codemod inserted `useTranslation` only into the first function it found,
 * but t() may be referenced in sibling functions/components within the same
 * file. This script:
 *   1. Parses each TSX file
 *   2. Finds every `function Name(...)` and `const Name = (...) =>` declaration
 *   3. If the function body uses `t(` but does NOT contain `useTranslation(`,
 *      injects `const { t } = useTranslation("common");` at the top
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'),
  'artifacts', 'erp-dashboard', 'src');

function walk(d, files = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist'].includes(e.name)) walk(p, files);
    } else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
  return files;
}

/**
 * Find function declarations whose body spans [bodyStart, bodyEnd] in the source.
 * Returns array of { name, bodyStart, bodyEnd, declarationLine }.
 * Uses a brace-counting walker, not a full parser — good enough for typical TSX.
 */
function findFunctionBodies(content) {
  const fns = [];
  const patterns = [
    /(?:^|\n)(?:export\s+(?:default\s+)?)?function\s+([A-Z][a-zA-Z0-9_]*)\s*[<(][^{]*\{/g,
    /(?:^|\n)(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*[:=]\s*\([^)]*\)\s*=>\s*\{/g,
    /(?:^|\n)(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*[:=]\s*[^=]*=>\s*\{/g,
  ];

  for (const re of patterns) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(content)) !== null) {
      const name = m[1];
      const openBraceIdx = m.index + m[0].length - 1;  // position of the {
      // Walk to find matching }
      let depth = 1;
      let i = openBraceIdx + 1;
      let inString = false;
      let stringChar = '';
      let inComment = false;
      let inTemplate = false;
      while (i < content.length && depth > 0) {
        const c = content[i];
        const prev = content[i - 1];
        if (inComment) {
          if (c === '\n') inComment = false;
        } else if (inString) {
          if (c === stringChar && prev !== '\\') inString = false;
        } else if (inTemplate) {
          if (c === '`' && prev !== '\\') inTemplate = false;
        } else {
          if (c === '/' && content[i + 1] === '/') { inComment = true; i++; }
          else if (c === '"' || c === "'") { inString = true; stringChar = c; }
          else if (c === '`') { inTemplate = true; }
          else if (c === '{') depth++;
          else if (c === '}') depth--;
        }
        i++;
      }
      fns.push({ name, bodyStart: openBraceIdx + 1, bodyEnd: i - 1, declarationStart: m.index });
    }
  }
  return fns;
}

let fixedFiles = 0;
let totalInjections = 0;

for (const f of walk(SRC)) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;

  // Quick reject: if file doesn't have t( and isn't a TSX, skip
  if (!/\bt\(/.test(content)) continue;

  // Find all function bodies
  const fns = findFunctionBodies(content);

  // Sort by bodyStart desc so we don't shift offsets while inserting
  fns.sort((a, b) => b.bodyStart - a.bodyStart);

  for (const fn of fns) {
    const body = content.slice(fn.bodyStart, fn.bodyEnd);
    if (!/\bt\(/.test(body)) continue;
    // Already has a hook in body?
    if (/\bconst\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation/.test(body)) continue;
    if (/\buseTranslation\s*\(/.test(body)) continue;  // direct call exists
    // Inject hook at beginning of body
    const hookLine = `\n  const { t } = useTranslation("common");`;
    content = content.slice(0, fn.bodyStart) + hookLine + content.slice(fn.bodyStart);
    totalInjections++;
  }

  if (content === original) continue;

  // Ensure import is present
  if (!/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]@\/lib\/i18n['"]/.test(content)) {
    const lines = content.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, `import { useTranslation } from '@/lib/i18n';`);
    } else {
      lines.unshift(`import { useTranslation } from '@/lib/i18n';`);
    }
    content = lines.join('\n');
  }

  fs.writeFileSync(f, content, 'utf8');
  fixedFiles++;
}

console.log(`Files fixed: ${fixedFiles}`);
console.log(`Total hook injections: ${totalInjections}`);
