#!/usr/bin/env node
/**
 * fix-material-sql.mjs — rewrite all SQL referencing material_cards to match
 * the legacy DB schema (xom_ashyo instead of name, category varchar instead
 * of category_id FK).
 *
 *   mc.name          → mc.xom_ashyo
 *   ORDER BY mc.name → ORDER BY mc.xom_ashyo
 *   c.id = mc.category_id → c.name = mc.category
 *   mc.* selects     → keep + add `mc.xom_ashyo AS name` alias if missing
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  'grep -rlE "(mc\\.name|mc\\.category_id)" apps/api/src --include="*.ts"',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`Found ${files.length} files to patch.`);

let totalReplacements = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;

  // 1. Fix JOIN: c.id = mc.category_id → c.name = mc.category
  //    The legacy schema doesn't have material_cards.category_id FK; it stores
  //    the category name directly in material_cards.category (varchar).
  content = content.replace(
    /\bc\.id\s*=\s*mc\.category_id\b/g,
    'c.name = mc.category',
  );

  // 2. WHERE/ORDER BY references: mc.name → mc.xom_ashyo
  //    But preserve "mc.name AS xxx" if used as alias source (rare).
  content = content.replace(
    /\bmc\.name\b(?!\s+AS\b)/g,
    'mc.xom_ashyo',
  );

  // 3. Add alias `mc.xom_ashyo AS name` to SELECT mc.* so frontend that reads
  //    .name still works. Only patch if "mc.xom_ashyo AS name" not already there.
  content = content.replace(
    /SELECT\s+mc\.\*/g,
    (match) => match.includes('AS name') ? match : 'SELECT mc.*, mc.xom_ashyo AS name',
  );

  if (content !== before) {
    fs.writeFileSync(f, content);
    const changes = (before.match(/mc\.name|mc\.category_id/g) || []).length
                  - (content.match(/mc\.name|mc\.category_id/g) || []).length;
    console.log(`  ${f}: ${changes} replacements`);
    totalReplacements += changes;
  }
}
console.log(`\nTotal replacements: ${totalReplacements}`);
console.log(`Files patched: ${files.length}`);
