/** Run a small sample of vitest smoke tests to verify they work */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Pick 5 representative files
const samples = [
  'src/pages/OrdersRegistry.smoke.test.tsx',
  'src/pages/AccountsPayableSections.smoke.test.tsx',
  'src/pages/CoordinationPage.smoke.test.tsx',
  'src/pages/IncomeExpense.smoke.test.tsx',
  'src/pages/WasteTracking.smoke.test.tsx',
];

let output = '';
let code = 0;
try {
  output = execSync(
    'npx vitest run --config vitest.config.ts --reporter=verbose ' + samples.join(' '),
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 }
  );
} catch (e) {
  output = (e.stdout || '') + (e.stderr || '');
  code = e.status || 1;
}
fs.writeFileSync(path.resolve(__dirname, '..', 'smoke-sample.log'), output);
console.log(JSON.stringify({ exitCode: code, bytes: output.length }));
