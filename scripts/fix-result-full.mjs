#!/usr/bin/env node
/**
 * EuroPrint ERP — To'liq Result Pattern Transformer
 *
 * 1. Repository: har bir async metod → Promise<Result<T>> + try/catch + Ok/Err
 * 2. Service: safeCall(() => this.repo.method()) → this.repo.method() ga o'zgartiradi
 *
 * Ishlatish: node scripts/fix-result-full.mjs [--dry-run] [--verbose]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
let fixed = 0;

const log = (...a) => VERBOSE && console.log(...a);
const info = (...a) => console.log(...a);

// ─── Repository transformer ────────────────────────────────────────

function ensureResultImport(content) {
  if (content.includes("from '@common/result'") || content.includes('from "@common/result"')) {
    return content.replace(
      /import\s*\{([^}]+)\}\s*from\s*(['"])@common\/result\2/g,
      (m, imports) => {
        const parts = imports.split(',').map(s => s.trim()).filter(Boolean);
        const add = ['Ok', 'Err', 'Result'].filter(n => !parts.includes(n));
        if (!add.length) return m;
        return `import { ${[...parts, ...add].join(', ')} } from '@common/result'`;
      }
    );
  }
  const fi = content.indexOf('import ');
  if (fi === -1) return content;
  return content.slice(0, fi) +
    `import { Ok, Err, Result } from '@common/result';\n` +
    content.slice(fi);
}

/**
 * Body ni parse qilib, barcha return x; → return Ok(x); ga o'zgartiradi
 */
function wrapBodyReturns(body) {
  // return null; → return Ok(null);
  // return undefined; → return Ok(undefined);
  // return someExpr; → return Ok(someExpr);
  // SKIP: return Ok(...), return Err(...)
  return body
    .replace(
      /(\n[ \t]*)return\s+((?!Ok\(|Err\()[^\n;{]+?)\s*;/g,
      (m, ws, expr) => `${ws}return Ok(${expr.trim()});`
    )
    .replace(/(\n[ \t]*)return\s*;/g, '$1return Ok(undefined);');
}

/**
 * Metod body ni try/catch bilan o'raydi
 */
function wrapWithTryCatch(body, indent) {
  const i = indent + '  ';
  const wrapped = body.replace(/^/gm, '  '); // indent++
  return `\n${indent}try {${wrapped}${indent}} catch (_e) {\n${indent}  return Err(String(_e));\n${indent}}\n${indent.slice(2)}`;
}

function fixRepository(file) {
  let content = readFileSync(file, 'utf8');
  const orig = content;

  // Import
  content = ensureResultImport(content);

  // Metodlarni qayta yozish — regex bilan methodSig + body
  // class ichidagi async metodlar: "  async name(...)...: RetType {"
  // Odd cases: multi-line signature
  content = content.replace(
    /([ \t]{2,})(async\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)(?:\s*:\s*(?!Promise<Result<)[^{]+)?)\s*\{/g,
    (m, indent, sig) => {
      // Already has Promise<Result<  
      if (sig.includes('Promise<Result<') || sig.includes('Result<')) return m;

      // Determine inner type from existing return annotation
      const rtm = sig.match(/\)\s*:\s*Promise<([^>]+(?:<[^>]*>)*)>/);
      const simm = sig.match(/\)\s*:\s*([A-Za-z][\w<>[\]|&, .]+(?:\[\])?)\s*$/);

      let newSig = sig;
      if (rtm) {
        newSig = sig.replace(`Promise<${rtm[1]}>`, `Promise<Result<${rtm[1]}>>`);
      } else if (simm && !['void', 'never', 'this'].includes(simm[1].trim())) {
        newSig = sig.replace(simm[0], `): Promise<Result<${simm[1].trim()}>>`);
      } else {
        // Annotatsiya yo'q — add Promise<Result<unknown>>
        newSig = sig.replace(/\)\s*$/, '): Promise<Result<unknown>>');
      }

      return `${indent}${newSig} {`;
    }
  );

  // Body ni o'zgartirish — har bir metod body:
  // Strategy: find methods without try/catch and without Ok/Err, wrap them
  content = content.replace(
    /([ \t]{2,}async\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)[^{]*\{)([\s\S]*?)(\n[ \t]{2,}\})/g,
    (m, open, body, close) => {
      // Skip if already has Ok/Err or try/catch
      if (body.includes('return Ok(') || body.includes('return Err(')) return m;

      const hasTry = /\btry\s*\{/.test(body);
      let newBody = wrapBodyReturns(body);

      if (!hasTry) {
        const indent = open.match(/^([ \t]+)/)?.[1] ?? '  ';
        // Don't double-wrap if body is empty or just whitespace
        if (newBody.trim() === '') return m;
        newBody = wrapWithTryCatch(newBody, indent);
      }

      return `${open}${newBody}${close}`;
    }
  );

  if (content === orig) return false;

  if (!DRY_RUN) writeFileSync(file, content, 'utf8');
  fixed++;
  log(`  ✓ repo: ${path.basename(file)}`);
  return true;
}

// ─── Service transformer ───────────────────────────────────────────

/**
 * Service faylida safeCall(() => this.repo.method()) →
 * return this.repo.method() ga o'zgartiradi
 */
function fixServiceCalls(file) {
  if (!existsSync(file)) return false;
  let content = readFileSync(file, 'utf8');
  const orig = content;

  // Pattern: safeCall(() => this.repoVar.method(args))
  // → return this.repoVar.method(args)
  // But only if the lambda has no extra logic (single expression)
  content = content.replace(
    /return\s+safeCall\(\s*\(\s*\)\s*=>\s*(this\.[a-zA-Z_$.]+\.[a-zA-Z_$]+\([^)]*\))\s*\)/g,
    'return $1'
  );

  // Multi-line simple: safeCall(() => {\n  return this.repo.method();\n})
  content = content.replace(
    /return\s+safeCall\(\s*\(\s*\)\s*=>\s*\{\s*\n?\s*return\s+(this\.[a-zA-Z_$.]+\.[a-zA-Z_$]+\([^)]*\))\s*;\s*\n?\s*\}\s*\)/g,
    'return $1'
  );

  if (content === orig) return false;
  if (!DRY_RUN) writeFileSync(file, content, 'utf8');
  log(`  ✓ svc: ${path.basename(file)}`);
  return true;
}

// ─── Main ──────────────────────────────────────────────────────────
info(`\n🔧 Full Result Pattern Fix${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

// 1. Repositories
const repos = execSync(
  `find apps/api/src/modules -name "*.repository.ts" | grep -v "spec\\|test\\|\\.d\\.ts"`,
  { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
).split('\n').filter(Boolean);

info(`📦 ${repos.length} repository fayl...`);
let repoFixed = 0;
for (const f of repos) {
  try { if (fixRepository(f)) repoFixed++; } catch(e) { log(`  ⚠ ${path.basename(f)}: ${e.message}`); }
}
info(`  ✅ ${repoFixed} ta repo o'zgartirildi`);

// 2. Services
const svcs = execSync(
  `find apps/api/src/modules -name "*.service.ts" | grep -v "spec\\|test\\|\\.d\\.ts"`,
  { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
).split('\n').filter(Boolean);

info(`\n⚙️  ${svcs.length} service fayl...`);
let svcFixed = 0;
for (const f of svcs) {
  try { if (fixServiceCalls(f)) svcFixed++; } catch(e) { log(`  ⚠ ${path.basename(f)}: ${e.message}`); }
}
info(`  ✅ ${svcFixed} ta service o'zgartirildi`);

info(`\n✅ Jami: ${fixed} ta fayl o'zgartirildi\n`);
