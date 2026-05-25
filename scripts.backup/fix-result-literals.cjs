const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const raw = execSync(
  'grep -rln "ok: false, error:" apps/api/src/modules --include="*.handler.ts" --include="*.service.ts" --include="*.listener.ts" || true',
  { encoding: 'utf8' }
).trim();

const files = raw ? raw.split('\n').filter(Boolean) : [];

let fixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;

  content = content.replace(
    /return\s*\{\s*ok\s*:\s*false\s*,\s*error\s*:\s*('(?:[^'\\]|\\.)*')\s*\}/g,
    'return Err($1)'
  );
  content = content.replace(
    /return\s*\{\s*ok\s*:\s*false\s*,\s*error\s*:\s*("(?:[^"\\]|\\.)*")\s*\}/g,
    'return Err($1)'
  );
  content = content.replace(
    /return\s*\{\s*ok\s*:\s*false\s*,\s*error\s*:\s*([\w]+\.message)\s*\}/g,
    'return Err($1)'
  );

  if (content !== original && content.includes('return Err(')) {
    const hasErrImport = /import\s*\{[^}]*\bErr\b/.test(content);
    if (!hasErrImport) {
      const hasCommonImport = content.includes("from '@common/result'");
      if (hasCommonImport) {
        content = content.replace(
          /import\s*\{([^}]+)\}\s*from\s*'@common\/result'/,
          (match, imports) => {
            const parts = imports.split(',').map(s => s.trim()).filter(Boolean);
            if (!parts.includes('Err')) parts.push('Err');
            return "import { " + parts.join(', ') + " } from '@common/result'";
          }
        );
      } else {
        content = "import { Err } from '@common/result';\n" + content;
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(f, content);
    fixed++;
    process.stdout.write('Fixed: ' + path.basename(f) + '\n');
  }
}
process.stdout.write('Total fixed: ' + fixed + '\n');
