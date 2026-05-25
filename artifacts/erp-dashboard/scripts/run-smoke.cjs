/** Run vitest smoke tests and write JSON summary */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
let output = '';
let code = 0;
try {
  output = execSync(
    'npx vitest run --config vitest.config.ts --reporter=json --testNamePattern="smoke" --outputFile=smoke-results.json',
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024, env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' } }
  );
} catch (e) {
  output = (e.stdout || '') + (e.stderr || '');
  code = e.status || 1;
}
fs.writeFileSync(path.resolve(__dirname, '..', 'smoke-stderr.log'), output);
console.log(JSON.stringify({ exitCode: code, bytes: output.length }));
