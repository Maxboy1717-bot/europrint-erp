// Pattern: `private async _initBackground(): Promise<void> { return safeCall(async () => {...}); }`
// The safeCall returns Result<void> but function expects void. Fix: drop `return`, await call.

import fs from 'node:fs';

const files = [
  'apps/api/src/modules/hr/telegram-bots/attendance-bot.service.ts',
  'apps/api/src/modules/hr/telegram-bots/hr-bot.service.ts',
  'apps/api/src/modules/hr/telegram-bots/learning-bot.service.ts',
  'apps/api/src/modules/hr/telegram-bots/manager-bot.service.ts',
  'apps/api/src/modules/hr/telegram-bots/notification-bot.service.ts',
  'apps/api/src/modules/hr/telegram-bots/recruitment-bot.service.ts',
  'apps/api/src/modules/hr/telegram-bots/report-bot.service.ts',
];

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  // Replace `return safeCall(async () => {` with `await safeCall(async () => {`
  // and ensure the closing `});` of safeCall doesn't need the return.
  src = src.replace(
    /(private async _initBackground\(\): Promise<void> \{\s*)return safeCall\(/m,
    '$1await safeCall(',
  );

  if (src !== before) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed}/${files.length} files`);
