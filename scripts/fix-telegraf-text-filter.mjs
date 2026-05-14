// Replace `bot.on('text', ...)` with `bot.on(message('text'), ...)` in Telegraf v4+ API.
// Add `import { message } from 'telegraf/filters'` if missing.

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

  const hasTextOn = /bot\.on\(['"]text['"]/.test(src);
  if (!hasTextOn) continue;

  // Ensure message filter import
  if (!/from\s*['"]telegraf\/filters['"]/.test(src)) {
    // Add after any telegraf import line (handles `import type { ... } from 'telegraf'`)
    src = src.replace(
      /(import[^\n]*from\s*['"]telegraf['"];?\s*$)/m,
      "$1\nimport { message } from 'telegraf/filters';",
    );
    // Fallback: if no telegraf import found, add at top
    if (!/from\s*['"]telegraf\/filters['"]/.test(src)) {
      src = src.replace(/^(import\s)/m, "import { message } from 'telegraf/filters';\n$1");
    }
  }

  // Replace bot.on('text', ... → bot.on(message('text'), ...
  src = src.replace(/bot\.on\(['"]text['"]/g, "bot.on(message('text')");

  if (src !== before) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed}/${files.length} files`);
