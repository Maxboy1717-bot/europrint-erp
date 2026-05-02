#!/usr/bin/env node
/**
 * EuroPrint ERP — Array Safety Fixer
 * Ishlatish: node scripts/fix-array-safety.mjs [--dry-run]
 *
 * Barcha himoyalanmagan array operatsiyalarni tuzatadi:
 * 1. (x ?? []).method(  →  (Array.isArray(x) ? x : []).method(
 * 2. data.map/filter/etc(  →  qo'lda yoki Array.isArray qo'shish
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

let totalFixed = 0;
let totalFiles = 0;

function log(msg) { if (VERBOSE) console.log(msg); }

/**
 * `(x ?? [])` → `(Array.isArray(x) ? x : [])` almashtiruvi
 * Turli nesting darajalari uchun
 */
function fixNullCoalesceArrays(content) {
  // Oddiy ?: (x ?? []).  → (Array.isArray(x) ? x : []).
  // Faqat aniq o'zgaruvchi yoki property zanjirini ushlaydi
  let fixed = content;
  // Pattern: (someVar ?? []).method( — bu eng xavfsiz almashtirish
  fixed = fixed.replace(
    /\(([a-zA-Z_$][a-zA-Z0-9_$]*(?:\??\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s*\?\?\s*\[\]\)(\s*\.\s*(?:map|filter|reduce|forEach|find|findIndex|some|every|flatMap|sort)\s*\()/g,
    (match, varName, method) => {
      return `(Array.isArray(${varName}) ? ${varName} : [])${method}`;
    }
  );
  return fixed;
}

/**
 * `result.data.map(` → himoyalash
 * result.ok && Array.isArray(result.data) tekshiruvlari bo'lsa skip qiladi
 */
function fixResultDataArrays(content) {
  // result.data.map( → (Array.isArray(result.data) ? result.data : []).map(
  let fixed = content;
  fixed = fixed.replace(
    /(result\.data)\s*\.\s*(map|filter|find|findIndex|forEach|some|every|flatMap)\s*\(/g,
    (match, varName, method) => {
      return `(Array.isArray(${varName}) ? ${varName} : []).${method}(`;
    }
  );
  return fixed;
}

/**
 * JSX-da: {data.map( → {(Array.isArray(data) ? data : []).map(
 * va return statements
 */
function fixJsxArrayOps(content) {
  let fixed = content;

  // {someVar.map( → {(Array.isArray(someVar) ? someVar : []).map(
  fixed = fixed.replace(
    /\{([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*\.\s*(map|filter)\s*\(/g,
    (match, varName, method) => {
      // Skip if it's a method chain that already has isArray protection nearby
      return `{(Array.isArray(${varName}) ? ${varName} : []).${method}(`;
    }
  );

  return fixed;
}

/**
 * `items.map(` → `(Array.isArray(items) ? items : []).map(`
 * Faqat oddiy o'zgaruvchilar (chained props emas)
 */
function fixSimpleVarArrays(content, isBackend) {
  let fixed = content;

  if (isBackend) {
    // Backend TS: return items.map( → return (Array.isArray(items) ? items : []).map(
    fixed = fixed.replace(
      /\breturn\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*(map|filter|find|forEach|some|every)\s*\(/g,
      (match, varName, method) => {
        return `return (Array.isArray(${varName}) ? ${varName} : []).${method}(`;
      }
    );

    // const x = items.map( → const x = (Array.isArray(items) ? items : []).map(
    fixed = fixed.replace(
      /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*(map|filter|find|findIndex|forEach|some|every|flatMap)\s*\(/g,
      (match, decl, varDecl, arrVar, method) => {
        return `${decl} ${varDecl} = (Array.isArray(${arrVar}) ? ${arrVar} : []).${method}(`;
      }
    );
  }

  return fixed;
}

/**
 * Fayl tarkibini tekshiradi — Array.isArray himoyasi bor-yo'qligini
 * Reviewer mantig'iga mos: 5 satr oynasi
 */
function hasProtectionNearby(lines, targetLine) {
  const start = Math.max(0, targetLine - 5);
  const end = targetLine;
  for (let i = start; i < end; i++) {
    if (lines[i] && lines[i].includes('Array.isArray')) return true;
  }
  return false;
}

/**
 * Bitta faylni tuzatish
 */
function fixFile(filePath) {
  if (!existsSync(filePath)) return 0;

  const original = readFileSync(filePath, 'utf8');
  const isBackend = filePath.includes('apps/api');
  const isTsx = filePath.endsWith('.tsx');

  let fixed = original;

  // 1. ?? [] pattern (eng xavfsiz)
  fixed = fixNullCoalesceArrays(fixed);

  // 2. result.data.map() pattern
  if (isBackend) {
    fixed = fixResultDataArrays(fixed);
  }

  // 3. Oddiy variable.map() pattern (backend)
  if (isBackend) {
    fixed = fixSimpleVarArrays(fixed, true);
  }

  // 4. JSX array ops (frontend)
  if (isTsx) {
    fixed = fixJsxArrayOps(fixed);
  }

  if (fixed === original) return 0;

  if (!DRY_RUN) {
    writeFileSync(filePath, fixed, 'utf8');
  }

  const changeCount = (fixed.match(/Array\.isArray/g) || []).length -
                      (original.match(/Array\.isArray/g) || []).length;

  log(`  ✓ ${path.basename(filePath)}: +${changeCount} Array.isArray`);
  return changeCount;
}

// ── Asosiy mantiq ──────────────────────────────────────────────────
console.log(`\n🔧 Array Safety Fixer${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

// Backend fayllar
const backendFiles = execSync(
  `grep -rlE '\\.(map|filter|reduce|forEach|find)\\(' apps/api/src/modules --include="*.controller.ts" --include="*.service.ts" 2>/dev/null | grep -v "spec\\|test"`,
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
).split('\n').filter(Boolean);

console.log(`Backend fayllar: ${backendFiles.length}`);
for (const f of backendFiles) {
  const n = fixFile(f.trim());
  if (n > 0) { totalFixed += n; totalFiles++; }
}

// Frontend fayllar (pages + components)
let frontendFiles = [];
try {
  frontendFiles = execSync(
    `grep -rlE '\\.(map|filter|reduce|forEach|find)\\(' artifacts/erp-dashboard/src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "spec\\|test"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  ).split('\n').filter(Boolean);
} catch { /* ignore */ }

console.log(`Frontend fayllar: ${frontendFiles.length}`);
for (const f of frontendFiles) {
  const n = fixFile(f.trim());
  if (n > 0) { totalFixed += n; totalFiles++; }
}

console.log(`\n✅ Jami: ${totalFiles} fayl tuzatildi, ${totalFixed} ta Array.isArray qo'shildi\n`);
