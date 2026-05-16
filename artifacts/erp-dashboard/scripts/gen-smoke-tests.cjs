/**
 * Generate Vitest smoke tests for every page under src/pages.
 * For each PageName.tsx (not already a test), produces PageName.smoke.test.tsx
 * that renders the page wrapped in TestProviders and asserts a non-null root.
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(REPO, 'src', 'pages');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && p.endsWith('.tsx') && !p.endsWith('.test.tsx') && !p.endsWith('.smoke.test.tsx')) {
      out.push(p);
    }
  }
  return out;
}

const pages = walk(PAGES_DIR);
let written = 0;
let skipped = 0;
let skippedReasons = {};

for (const fullPath of pages) {
  const dir = path.dirname(fullPath);
  const baseName = path.basename(fullPath, '.tsx');
  const testPath = path.join(dir, baseName + '.smoke.test.tsx');

  if (fs.existsSync(testPath)) {
    skipped++;
    skippedReasons.exists = (skippedReasons.exists || 0) + 1;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Detect default export pattern.
  const defFn = content.match(/export default function (\w+)/);
  const defConst = content.match(/^export default (\w+)\s*;?/m);
  const defAnon = content.match(/^export default \(/m) || content.match(/^export default function\s*\(/m);

  let importStmt;
  if (defFn || defConst || defAnon) {
    importStmt = "import Page from './" + baseName + "';";
  } else {
    // Look for named export matching the file basename or PascalCase.
    const named = content.match(new RegExp('export (?:function|const) (' + baseName.replace(/[^A-Za-z0-9_]/g, '.') + ')\\b'));
    if (named) {
      importStmt = "import { " + named[1] + " as Page } from './" + baseName + "';";
    } else {
      // Generic: pick first export.
      const anyNamed = content.match(/export (?:function|const) (\w+)/);
      if (anyNamed) {
        importStmt = "import { " + anyNamed[1] + " as Page } from './" + baseName + "';";
      } else {
        skipped++;
        skippedReasons.noExport = (skippedReasons.noExport || 0) + 1;
        continue;
      }
    }
  }

  const test =
`/**
 * @module ${baseName}.smoke.test
 * @description Smoke test: render does not throw.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
${importStmt}

describe('${baseName} smoke', () => {
  it('renders without throwing', () => {
    const { container } = render(<Page />, { wrapper: TestProviders });
    expect(container.firstChild).not.toBeNull();
  });
});
`;

  fs.writeFileSync(testPath, test);
  written++;
}

console.log(JSON.stringify({ totalPages: pages.length, written, skipped, skippedReasons }, null, 2));
