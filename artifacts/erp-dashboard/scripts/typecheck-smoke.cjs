/**
 * Typecheck smoke tests in isolation by creating a temporary tsconfig
 * that includes them (the main tsconfig excludes *.test.tsx files).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const tmpConfig = path.join(ROOT, 'tsconfig.smoke.json');

const config = {
  extends: './tsconfig.json',
  include: ['src/**/*.smoke.test.tsx', 'src/**/*.ts', 'src/**/*.tsx'],
  exclude: ['node_modules', 'build', 'dist'],
  compilerOptions: {
    noEmit: true,
  },
};
fs.writeFileSync(tmpConfig, JSON.stringify(config, null, 2));

let output = '';
let code = 0;
try {
  output = execSync('npx tsc -p tsconfig.smoke.json --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 500 * 1024 * 1024 });
} catch (e) {
  output = (e.stdout || '') + (e.stderr || '');
  code = e.status || 1;
}
fs.writeFileSync(path.join(ROOT, 'tsc-smoke-output.log'), output);
const lines = output.split('\n').filter(Boolean).length;
console.log(JSON.stringify({ exitCode: code, lines, bytes: output.length }));
