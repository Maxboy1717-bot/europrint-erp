#!/usr/bin/env node
/**
 * Multi-line method signature larni Promise<Result<T>> ga o'tkazadi
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
let fixedCount = 0;

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const out = [];
  let i = 0;
  let changed = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Multi-line async method başlangıcını topish
    // "  async methodName(" — closing paren keyingi satrlarda
    if (/^[ \t]{2,}async\s+[a-zA-Z_$]/.test(line) && !line.includes('Promise<Result<')) {
      // Methodning to'liq signaturini yig'amiz
      let sigLines = [line];
      let j = i + 1;
      let parenDepth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;

      // Opening { topguncha davom etamiz
      while (j < lines.length && !sigLines.join('\n').trimEnd().endsWith('{')) {
        if (parenDepth <= 0 && sigLines.join('\n').includes(')')) break;
        const nextLine = lines[j];
        sigLines.push(nextLine);
        parenDepth += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
        if (nextLine.trimEnd().endsWith('{')) break;
        j++;
      }

      // Signature to'plandi — Promise<Result< bor-yo'qligini tekshirish
      const fullSig = sigLines.join('\n');
      if (fullSig.includes('Promise<Result<') || fullSig.includes('Result<')) {
        out.push(...sigLines);
        i = j + 1;
        continue;
      }

      // Return type ni topish va o'zgartirish
      // Pattern: ): ReturnType { yoki ): Promise<T> {
      let newSigLines = [...sigLines];
      const lastSigLine = newSigLines[newSigLines.length - 1];

      if (lastSigLine.includes('Promise<') && !lastSigLine.includes('Promise<Result<')) {
        // Promise<T> → Promise<Result<T>>
        newSigLines[newSigLines.length - 1] = lastSigLine.replace(
          /Promise<([^>]+(?:<[^>]*>)*)>/,
          (m, inner) => `Promise<Result<${inner}>>`
        );
        changed++;
      } else if (/\)\s*:\s*[A-Za-z]/.test(lastSigLine) && lastSigLine.includes('{')) {
        // Simple return type: ): Type {
        newSigLines[newSigLines.length - 1] = lastSigLine.replace(
          /\)\s*:\s*([A-Za-z][\w<>[\]|&, ]*)\s*\{/,
          (m, t) => `): Promise<Result<${t.trim()}>> {`
        );
        changed++;
      } else if (lastSigLine.trimEnd().endsWith('{')) {
        // No return type annotation
        newSigLines[newSigLines.length - 1] = lastSigLine.replace(
          /\)\s*\{/,
          '): Promise<Result<unknown>> {'
        );
        changed++;
      }

      // Make sure Result import exists
      out.push(...newSigLines);
      i = j + 1;
      continue;
    }

    // return null; → return Ok(null);
    if (/^\s*return null\s*;/.test(line)) {
      out.push(line.replace(/return null\s*;/, 'return Ok(null);'));
      i++;
      changed++;
      continue;
    }

    out.push(line);
    i++;
  }

  if (changed === 0) return 0;

  // Ensure Result import
  let result = out.join('\n');
  if (!result.includes("from '@common/result'") && !result.includes('from "@common/result"')) {
    const fi = result.indexOf('import ');
    if (fi !== -1) {
      result = result.slice(0, fi) + `import { Ok, Err, Result } from '@common/result';\n` + result.slice(fi);
    }
  } else {
    result = result.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@common\/result['"]/,
      (m, imp) => {
        const parts = imp.split(',').map(s => s.trim()).filter(Boolean);
        const add = ['Ok', 'Err', 'Result'].filter(n => !parts.includes(n));
        if (!add.length) return m;
        return `import { ${[...parts, ...add].join(', ')} } from '@common/result'`;
      }
    );
  }

  if (!DRY_RUN) writeFileSync(filePath, result, 'utf8');
  fixedCount++;
  console.log(`  ✓ ${path.basename(filePath)}: ${changed} o'zgarish`);
  return changed;
}

// Faqat hali failing bo'lgan fayllar
const TARGET_FILES = [
  'chat-message-base.repository.ts',
  'chat-message.repository.ts',
  'chat-room.repository.ts',
  'ecommerce.repository.ts',
  'shift.repository.ts',
  'position-folder.repository.ts',
  'qc-new.repository.ts',
  'qc-parameters.repository.ts',
];

console.log('\n🔧 Multi-line Method Fixer\n');

for (const fname of TARGET_FILES) {
  const result = execSync(`find apps/api/src -name "${fname}" 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
  if (result) {
    try { fixFile(result); } catch(e) { console.log(`  ⚠ ${fname}: ${e.message}`); }
  }
}

console.log(`\n✅ ${fixedCount} fayl tuzatildi\n`);
