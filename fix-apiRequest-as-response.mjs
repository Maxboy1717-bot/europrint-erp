#!/usr/bin/env node
/**
 * fix-apiRequest-as-response.mjs — replace the anti-pattern:
 *
 *   const res = await apiRequest('GET', '/api/...') as unknown as Response;
 *   if (!res.ok) throw new Error('... failed');
 *   return res.json() as Promise<T>;
 *
 * with the correct usage:
 *
 *   return apiRequest<T>('GET', '/api/...');
 *
 * apiRequest already unwraps the Result envelope and returns T directly, NOT
 * a Response. Calling .ok / .json() on it throws at runtime, breaking the page.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  'grep -rlE "apiRequest\\([^)]*\\) as unknown as Response" artifacts/erp-dashboard/src --include="*.tsx" --include="*.ts"',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`Found ${files.length} files with the bug.`);

let totalFixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;

  // Pattern: queryFn async with single GET + .ok check + .json() return
  // Use multiline regex to capture the typical 3-line idiom.
  const pattern = /queryFn:\s*async\s*\(\)\s*=>\s*\{\s*\n\s*const\s+res\s*=\s*await\s+apiRequest\(\s*'(GET|POST|PUT|PATCH|DELETE)',\s*("[^"]+"|`[^`]+`)\s*\)\s*as\s+unknown\s+as\s+Response\s*;\s*\n\s*if\s*\(\s*!res\.ok\s*\)\s*throw\s+new\s+Error\([^)]+\)\s*;\s*\n\s*return\s+res\.json\(\)\s+as\s+Promise<(\w+(?:<[^>]+>)?)>\s*;\s*\n\s*\}/g;

  content = content.replace(pattern, (match, method, urlExpr, type) => {
    return `queryFn: () => apiRequest<${type}>('${method}', ${urlExpr})`;
  });

  if (content !== before) {
    fs.writeFileSync(f, content);
    const fixCount = (before.match(/as unknown as Response/g) || []).length
                   - (content.match(/as unknown as Response/g) || []).length;
    console.log(`  ${f}: -${fixCount}`);
    totalFixed += fixCount;
  }
}
console.log(`\nTotal patterns fixed: ${totalFixed}`);

// Re-scan to see how many remain
const remaining = execSync(
  'grep -rE "apiRequest\\([^)]*\\) as unknown as Response" artifacts/erp-dashboard/src --include="*.tsx" --include="*.ts" | wc -l',
  { encoding: 'utf8' }
).trim();
console.log(`Remaining instances of the anti-pattern: ${remaining}`);
console.log('(These are non-standard variants — fix manually if needed.)');
