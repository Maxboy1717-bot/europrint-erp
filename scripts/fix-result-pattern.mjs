#!/usr/bin/env node
/**
 * EuroPrint ERP — Result Pattern Fixer
 * Repository metodlarini Promise<Result<T>> ga o'tkazadi
 *
 * Ishlatish: node scripts/fix-result-pattern.mjs [--dry-run] [--verbose]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

let totalFixed = 0;
let totalFiles = 0;

function log(...args) { if (VERBOSE) console.log(...args); }
function info(...args) { console.log(...args); }

/**
 * Import qo'shish
 */
function addResultImport(content) {
  if (content.includes("from '@common/result'") || content.includes('from "@common/result"')) {
    // Mavjud import ga Ok, Err, Result qo'shamiz
    return content.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@common\/result['"]/g,
      (match, imports) => {
        const existing = imports.split(',').map(s => s.trim()).filter(Boolean);
        const needed = ['Ok', 'Err', 'Result'];
        const toAdd = needed.filter(n => !existing.includes(n));
        if (toAdd.length === 0) return match;
        return `import { ${[...existing, ...toAdd].join(', ')} } from '@common/result'`;
      }
    );
  }
  // Yangi import qo'shish — birinchi import dan oldin
  const firstImport = content.indexOf('import ');
  if (firstImport === -1) return content;
  return content.slice(0, firstImport) +
    `import { Ok, Err, Result } from '@common/result';\n` +
    content.slice(firstImport);
}

/**
 * Bitta async metod blokini Result pattern ga o'tkazadi.
 * @param {string} methodSig - metod signaturi (async keyword dan closing { gacha)
 * @param {string} body - metod tanasi (opening { va closing } o'rtasi)
 * @returns {{sig: string, body: string}} - yangi signature va body
 */
function transformMethod(methodSig, body) {
  // Allaqachon Result<> bor bo'lsa skip
  if (methodSig.includes('Promise<Result<') || methodSig.includes('Result<')) {
    return null;
  }

  // Return type ni topish
  const returnTypeMatch = methodSig.match(/\)\s*:\s*Promise<([^>]+(?:<[^>]*>)*)>/);
  const simpleReturnMatch = methodSig.match(/\)\s*:\s*([A-Za-z<>[\]|&, ]+(?:\[\])?)\s*\{/);

  let innerType = 'unknown';
  let newSig = methodSig;

  if (returnTypeMatch) {
    innerType = returnTypeMatch[1];
    newSig = methodSig.replace(
      /Promise<([^>]+(?:<[^>]*>)*)>/,
      `Promise<Result<${innerType}>>`
    );
  } else if (simpleReturnMatch && simpleReturnMatch[1].trim() !== '{') {
    innerType = simpleReturnMatch[1].trim();
    newSig = methodSig.replace(
      /\)\s*:\s*([A-Za-z<>[\]|&, ]+(?:\[\])?)\s*\{/,
      `): Promise<Result<${innerType}>> {`
    );
  } else {
    // Return type yo'q — `Promise<Result<unknown>>` qo'shamiz
    newSig = methodSig.replace(/\)\s*\{/, '): Promise<Result<unknown>> {');
  }

  // Body ni try/catch bilan o'raylik
  // Body ichida allaqachon try/catch bor bo'lsa, faqat return ni o'zgartiramiz
  const hasTryCatch = /\btry\s*\{/.test(body);
  const hasOk = body.includes('return Ok(') || body.includes('return Err(');

  let newBody = body;

  if (hasOk) {
    // Allaqachon Ok/Err ishlatilmoqda — faqat return type o'zgartirdik
    return { sig: newSig, body: newBody };
  }

  if (hasTryCatch) {
    // try/catch bor lekin Ok/Err yo'q — faqat return ni Ok() bilan o'rash
    newBody = wrapReturns(body);
    return { sig: newSig, body: newBody };
  }

  // try/catch yo'q — to'liq o'rash
  const wrappedReturns = wrapReturns(body);

  // Indent darajasini aniqlash
  const firstLine = body.split('\n').find(l => l.trim());
  const indent = firstLine ? firstLine.match(/^(\s*)/)[1] : '    ';

  newBody = `\n${indent}try {${wrappedReturns}${indent}} catch (e) {\n${indent}  return Err(String(e));\n${indent}}\n  `;

  return { sig: newSig, body: newBody };
}

/**
 * Body ichidagi `return expr;` larni `return Ok(expr);` ga o'zgartiradi.
 * `return null;` → `return Ok(null);` (yoki `Err` — service da handle qilinadi)
 */
function wrapReturns(body) {
  return body
    .replace(/(\n\s*)return\s+((?!Ok\(|Err\(|null;|undefined;)[^;{]+);/g, (match, newline, expr) => {
      const trimmed = expr.trim();
      if (trimmed === 'null' || trimmed === 'undefined') {
        return `${newline}return Ok(null);`;
      }
      return `${newline}return Ok(${trimmed});`;
    })
    .replace(/(\n\s*)return\s+null\s*;/g, '$1return Ok(null);')
    .replace(/(\n\s*)return\s+undefined\s*;/g, '$1return Ok(undefined);');
}

/**
 * Repository faylini o'qib, barcha async metodlarni Result pattern ga o'tkazadi
 */
function fixRepository(filePath) {
  if (!existsSync(filePath)) return 0;

  const original = readFileSync(filePath, 'utf8');

  // Allaqachon to'liq Result pattern ishlatilayotgan bo'lsa skip
  const asyncMethods = (original.match(/^\s+async\s+[a-zA-Z_]/gm) || []).length;
  const resultMethods = (original.match(/Promise<Result</g) || []).length;

  if (asyncMethods > 0 && resultMethods >= asyncMethods) {
    log(`  ⏭ ${path.basename(filePath)}: allaqachon to'liq Result (${resultMethods}/${asyncMethods})`);
    return 0;
  }

  // Import qo'shish
  let fixed = addResultImport(original);

  // Metod lar ni topish va o'zgartirish
  // Regex: async methodName(...): ReturnType { ...body... }
  // Bu murakkabroq — class ichidagi metodlarni to'g'ri ushlash kerak
  let changeCount = 0;

  // Method signature + body pattern — balanced braces ushlash qiyin regex bilan
  // Sodda yondashuv: satr bo'yicha iterate qilib, { } ni hisoblash
  const lines = fixed.split('\n');
  const newLines = [];
  let i = 0;
  let inMethod = false;
  let methodStartLine = -1;
  let methodSig = '';
  let braceDepth = 0;
  let methodLines = [];
  let classDepth = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Class start/end
    if (/\bclass\s+/.test(line) && line.includes('{')) classDepth++;
    if (classDepth > 0 && !inMethod) {
      // Closing brace of class
      if (line.trim() === '}') { classDepth--; newLines.push(line); i++; continue; }
    }

    // Method detection: "  async methodName(" — class ichida (2+ spaces indent)
    if (!inMethod && classDepth > 0 && /^[ \t]{2,}async\s+[a-zA-Z_$]/.test(line)) {
      // Metod signaturi bir yoki bir necha satrda bo'lishi mumkin
      // Opening { ni topamiz
      let sigLines = [line];
      let j = i;
      while (j < lines.length && !sigLines.join('').includes('{')) {
        j++;
        if (j < lines.length) sigLines.push(lines[j]);
      }

      const fullSig = sigLines.join('\n');
      const openBraceIdx = fullSig.lastIndexOf('{');
      methodSig = fullSig.slice(0, openBraceIdx + 1);

      // Check if this method should be transformed
      if (!methodSig.includes('Promise<Result<') && !methodSig.includes('Result<')) {
        // Bu metod o'zgartirilishi kerak
        inMethod = true;
        methodStartLine = i;
        braceDepth = 1;
        methodLines = [];
        i = j + 1;

        // Body satrlarini yig'ish
        while (i < lines.length && braceDepth > 0) {
          const bl = lines[i];
          for (const ch of bl) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;
          }
          if (braceDepth > 0) {
            methodLines.push(bl);
          } else {
            // Closing brace line — faqat closing } bo'lsa
            const closingContent = bl.trim();
            if (closingContent !== '}') {
              // Closing brace bir satrda boshqa content bilan
              const closingBraceIdx = bl.lastIndexOf('}');
              const beforeClose = bl.slice(0, closingBraceIdx);
              if (beforeClose.trim()) methodLines.push(beforeClose);
            }
          }
          i++;
        }

        // Transform qilish
        const body = '\n' + methodLines.join('\n') + '\n  ';
        const result = transformMethod(methodSig, body);

        if (result) {
          changeCount++;
          newLines.push(result.sig);
          newLines.push(...result.body.split('\n'));
          newLines.push('  }');
          log(`    ✓ transformed: ${methodSig.trim().slice(0, 60)}`);
        } else {
          // No change needed
          newLines.push(methodSig);
          newLines.push(...methodLines);
          newLines.push('  }');
        }
        inMethod = false;
        continue;
      }
    }

    newLines.push(line);
    i++;
  }

  if (changeCount === 0) return 0;

  const output = newLines.join('\n');

  if (!DRY_RUN) {
    writeFileSync(filePath, output, 'utf8');
  }

  log(`  ✓ ${path.basename(filePath)}: ${changeCount} ta metod o'zgartirildi`);
  return changeCount;
}

// ── Asosiy mantiq ──────────────────────────────────────────────────
info(`\n🔧 Result Pattern Fixer${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

const repoFiles = execSync(
  `find apps/api/src/modules -name "*.repository.ts" 2>/dev/null | grep -v "spec\\|test\\|\\.d\\.ts"`,
  { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
).split('\n').filter(Boolean);

info(`Repository fayllar: ${repoFiles.length}`);

for (const f of repoFiles) {
  try {
    const n = fixRepository(f.trim());
    if (n > 0) { totalFixed += n; totalFiles++; }
  } catch (e) {
    log(`  ⚠ ${path.basename(f)}: xato — ${e.message}`);
  }
}

info(`\n✅ Jami: ${totalFiles} fayl, ${totalFixed} ta metod o'zgartirildi\n`);
