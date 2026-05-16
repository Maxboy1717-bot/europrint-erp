/** Run tsc --noEmit and write output to tsc-output.log */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
let output = '';
let code = 0;
try {
  output = execSync('npx tsc --noEmit', { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 500 * 1024 * 1024 });
} catch (e) {
  output = (e.stdout || '') + (e.stderr || '');
  code = e.status || 1;
}
fs.writeFileSync(path.resolve(__dirname, '..', 'tsc-output.log'), output);
const lines = output.split('\n').length;
console.log(JSON.stringify({ exitCode: code, lines }));
