// Vaqtinchalik: barcha NestJS controllerlardagi takror (METHOD + full path) route'larni topadi.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'apps/api/src';
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (p.endsWith('.controller.ts')) files.push(p);
  }
})(ROOT);

const routes = new Map(); // key: "METHOD /full/path" -> [ "file:line" ]
const methodRe = /@(Get|Post|Put|Patch|Delete|All)\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)?\s*\)/;
const ctrlRe = /@Controller\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)?\s*\)/;

const norm = (s) => ('/' + (s || '')).replace(/\/+/g, '/').replace(/\/$/, '') || '/';

for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  let prefix = null;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip comment lines — a `//` or JSDoc `*`/`/**` line that merely MENTIONS a
    // route (e.g. "Declared BEFORE @Get(':id') so ...") is not a real decorator
    // and was producing false-positive "duplicates" against the real route below it.
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    const cm = lines[i].match(ctrlRe);
    if (cm) prefix = cm[1] ?? cm[2] ?? cm[3] ?? '';
    const mm = lines[i].match(methodRe);
    if (mm && prefix !== null) {
      const method = mm[1].toUpperCase();
      const sub = mm[2] ?? mm[3] ?? mm[4] ?? '';
      const full = norm('/api/' + prefix + '/' + sub);
      const key = method + ' ' + full;
      if (!routes.has(key)) routes.set(key, []);
      routes.get(key).push(`${f}:${i + 1}`);
    }
  }
}

const dups = [...routes.entries()].filter(([, v]) => v.length > 1);
console.log(`Jami route: ${routes.size} | TAKROR: ${dups.length}\n`);
for (const [key, locs] of dups.sort()) {
  console.log(key);
  for (const l of locs) console.log('   ' + l);
}

// Pre-commit gate (.husky/pre-commit) relies on this exit code to block the
// commit. Without it, this scan was purely decorative — it printed real
// duplicates (shadowed/unreachable routes) but always exited 0.
if (dups.length > 0) {
  console.error(`\n❌ ${dups.length} ta takror METHOD+path topildi — ikkinchi handler soyada qoladi (hech qachon chaqirilmaydi).`);
  process.exit(1);
}
