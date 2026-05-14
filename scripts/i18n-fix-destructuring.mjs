#!/usr/bin/env node
/**
 * Fix destructuring defaults broken by i18n-codemod-uz.mjs.
 *
 * Bad pattern (codemod converted UZ default to JSX-style attribute):
 *   export function X({
 *     title={t("xxx")},
 *     description={t("yyy")},
 *     ...
 *   }: Props) { ... <h1>{title}</h1> ... }
 *
 * Fix:
 *   export function X({
 *     title,
 *     description,
 *     ...
 *   }: Props) {
 *     const { t } = useTranslation("common");  // if not present
 *     const resolvedTitle = title ?? t("xxx");
 *     const resolvedDescription = description ?? t("yyy");
 *     ...
 *     <h1>{resolvedTitle}</h1>
 *     ...
 *   }
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

let fixedFiles = 0;
let totalFixes = 0;

for (const f of walk(SRC)) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;

  // Find broken destructuring defaults
  // Pattern: \n  paramName={t("key")},  inside function signature
  const lines = content.split('\n');
  const fixes = [];   // { lineIdx, param, key }
  let inDestructure = false;
  let destructureStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Detect entering destructuring: line ends with '({'
    if (/[(,]\s*\{\s*$/.test(l)) {
      inDestructure = true;
      destructureStartLine = i;
      continue;
    }
    // Detect leaving destructuring: line has '}:' or '})'
    if (inDestructure && /^\s*\}\s*[:)]/.test(l)) {
      inDestructure = false;
      continue;
    }
    // Inside destructuring, look for the broken pattern
    if (inDestructure) {
      const m = l.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)=\{t\("([^"]+)"\)\},?(\s*)$/);
      if (m) {
        fixes.push({ lineIdx: i, indent: m[1], param: m[2], key: m[3], trailing: m[4] });
      }
    }
  }

  if (fixes.length === 0) continue;

  // Apply: 1) rewrite each broken line to just `paramName,`
  //        2) find function body opening '{' after destructuring
  //        3) insert `const resolvedX = X ?? t("xxx");` lines after hook
  //        4) replace {param} with {resolvedParam} in the rest of the function body

  for (const fix of fixes) {
    lines[fix.lineIdx] = `${fix.indent}${fix.param},${fix.trailing}`;
  }

  // Find function body opening — the line after `}: Props) {`
  let bodyStartLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\}\s*:\s*\w+(?:Props)?\s*\)\s*\{\s*$/.test(lines[i])) {
      bodyStartLine = i + 1;
      break;
    }
    // Also handle: }: ComponentProps) => {
    if (/\}\s*:\s*\w+(?:Props)?\s*\)\s*=>\s*\{\s*$/.test(lines[i])) {
      bodyStartLine = i + 1;
      break;
    }
  }
  if (bodyStartLine === -1) {
    console.log(`  WARN ${path.relative(SRC, f)}: couldn't find function body start; skipping resolved-vars insert`);
    fs.writeFileSync(f, lines.join('\n'), 'utf8');
    fixedFiles++;
    totalFixes += fixes.length;
    continue;
  }

  // Check if hook is already present near the body start
  let hookLine = -1;
  for (let i = bodyStartLine; i < Math.min(lines.length, bodyStartLine + 20); i++) {
    if (/const\s*\{\s*t[\s,}].*useTranslation/.test(lines[i])) {
      hookLine = i;
      break;
    }
  }

  // Build the resolved-vars block
  const resolvedLines = [];
  if (hookLine === -1) {
    resolvedLines.push(`  const { t } = useTranslation("common");`);
  }
  for (const fix of fixes) {
    const capitalized = fix.param.charAt(0).toUpperCase() + fix.param.slice(1);
    resolvedLines.push(`  const resolved${capitalized} = ${fix.param} ?? t("${fix.key}");`);
  }

  // Insert after hook line if it exists, else right after function body start
  const insertAfter = hookLine !== -1 ? hookLine + 1 : bodyStartLine;
  lines.splice(insertAfter, 0, ...resolvedLines);

  // Replace {param} with {resolvedParam} in the rest of the file
  // Carefully — avoid replacing inside strings or comments
  const insertedLines = resolvedLines.length;
  for (let i = insertAfter + insertedLines; i < lines.length; i++) {
    for (const fix of fixes) {
      const capitalized = fix.param.charAt(0).toUpperCase() + fix.param.slice(1);
      const resolvedName = `resolved${capitalized}`;
      // Replace `{param}` with `{resolvedParam}` only as a whole identifier
      const re = new RegExp(`\\{${fix.param}\\}`, 'g');
      lines[i] = lines[i].replace(re, `{${resolvedName}}`);
      // Also replace standalone `param` references (e.g., `<h1>{param ? ...}` or as JSX attr value)
      // Be safer: only replace `{param}`, `(param)`, `${param}`, ` param `
    }
  }

  // Ensure useTranslation is imported
  if (!/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]@\/lib\/i18n['"]/.test(lines.join('\n'))) {
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, `import { useTranslation } from '@/lib/i18n';`);
    } else {
      lines.unshift(`import { useTranslation } from '@/lib/i18n';`);
    }
  }

  content = lines.join('\n');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    fixedFiles++;
    totalFixes += fixes.length;
    console.log(`  ${fixes.length.toString().padStart(2)} :: ${path.relative(SRC, f)}`);
  }
}

console.log(`\nFiles fixed: ${fixedFiles}`);
console.log(`Total destructuring defaults fixed: ${totalFixes}`);
