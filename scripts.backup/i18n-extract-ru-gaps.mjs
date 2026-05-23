#!/usr/bin/env node
/**
 * i18n-extract-ru-gaps.mjs — emit a CSV of every UZ→RU key that still needs
 * a human translator. Compatible with Google Sheets / Excel.
 *
 *   node scripts/i18n-extract-ru-gaps.mjs                 # writes ru-gaps.csv
 *   node scripts/i18n-extract-ru-gaps.mjs --out=foo.csv   # custom path
 *   node scripts/i18n-extract-ru-gaps.mjs --top=200       # only worst N
 *   node scripts/i18n-extract-ru-gaps.mjs --json          # JSON stream
 *
 * A "gap" is any RU value that is missing, a stub (= UZ verbatim and not
 * whitelisted), or non-Cyrillic (and not whitelisted).
 *
 * Output columns:
 *   namespace, key, uz, ru_current, classification, suggested_ru
 *
 * `suggested_ru` is filled from scripts/i18n-ru-manual-translations.json
 * when a match exists; otherwise blank for a human/agent to fill in.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UZ_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/uz');
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');
const DICT_PATH = path.join(ROOT, 'scripts/i18n-ru-manual-translations.json');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const OUT_PATH = args.out || path.join(ROOT, 'ru-gaps.csv');
const TOP = args.top ? Number(args.top) : Infinity;
const JSON_OUT = !!args.json;

const WHITELIST = new Set([
  'EuroPrint', 'EuroPrint ERP', 'EuroPrint LLC',
  'ABC', 'AQL', 'BOM', 'CFO', 'CRM', 'CSV', 'DDD', 'DTO', 'EBITDA', 'ERP',
  'FEFO', 'FIFO', 'FMEA', 'GL', 'GMP', 'HR', 'INPS', 'IoT', 'JSON', 'JSHD',
  'KPI', 'LMS', 'MES', 'MM', 'MRO', 'MRP', 'OEE', 'OKR', 'OTP', 'PDF', 'PNG',
  'POS', 'PP', 'QC', 'ROI', 'SD', 'SLA', 'SoD', 'SPC', 'SVG', 'TLS', 'TPM',
  'UI', 'UX', 'VAT', 'WMS', 'XML', 'YAML', 'ZPL',
  'Anthropic', 'Bun', 'BullMQ', 'Claude', 'Dapper', 'Docker', 'Drizzle',
  'Fastify', 'Git', 'GitHub', 'GPT-4', 'GPT-4o', 'Grafana', 'Helm', 'Helmet',
  'JWT', 'Kibana', 'Kubernetes', 'Linux', 'MinIO', 'NestJS', 'Next.js', 'Nginx',
  'Node.js', 'OpenAI', 'Passport', 'PM2', 'PostgreSQL', 'Prometheus', 'React',
  'Redis', 'Sentry', 'Socket.io', 'Tailwind', 'TypeScript', 'Vite', 'Vitest',
  'Zod',
  'Instagram', 'Telegram', 'WhatsApp', 'YouTube', 'Jitsi', 'Slack', '8x8.vc',
  'Google', 'Yandex',
  'UZS', 'USD', 'EUR', 'RUB', 'm²', 'kg', 't', 'kWh',
  '.pdf', '.xlsx', '.csv', '.docx', '.png', '.jpg', '.svg',
]);
const CYRILLIC_RE = /[Ѐ-ӿ]/;
const LATIN_RE = /[A-Za-z]/;

function isBrandLike(v) {
  if (!v || CYRILLIC_RE.test(v)) return false;
  if (v.length > 60) return false;
  if (v.length <= 5 && /^[A-Za-z0-9]+$/.test(v)) return true;
  if (!/[A-Z]/.test(v)) return false;
  return /^[A-Za-z0-9 .,\-—_:/&@#№%()[\]↔…!?'"+]+$/.test(v);
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
function readNs(dir, name) {
  const file = path.join(dir, `${name}.json`);
  if (!fs.existsSync(file)) return null;
  return flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
}
function csvEscape(s) {
  const str = String(s ?? '');
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const dict = fs.existsSync(DICT_PATH)
  ? JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'))
  : {};

const namespaces = fs.readdirSync(UZ_DIR)
  .filter((f) => f.endsWith('.json') && !f.includes('before-codemod'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

const gaps = [];
for (const ns of namespaces) {
  const uz = readNs(UZ_DIR, ns) ?? {};
  const ru = readNs(RU_DIR, ns) ?? {};
  for (const [key, uzVal] of Object.entries(uz)) {
    if (typeof uzVal !== 'string') continue;
    const uz_s = uzVal.trim();
    if (!uz_s) continue;
    const has = key in ru;
    const ruVal = has ? String(ru[key] ?? '').trim() : '';

    let cls = null;
    if (!has || ruVal === '') cls = 'missing';
    else if (CYRILLIC_RE.test(ruVal)) cls = null;       // already Cyrillic = ok
    else if (WHITELIST.has(ruVal)) cls = null;          // whitelist = ok
    else if (isBrandLike(ruVal)) cls = null;            // brand/acronym = ok
    else if (!LATIN_RE.test(ruVal)) cls = null;         // symbols only = ok
    else if (ruVal === uz_s) cls = 'stub';
    else cls = 'non-cyrillic';

    if (cls) {
      gaps.push({
        namespace: ns,
        key,
        uz: uz_s,
        ru_current: ruVal,
        classification: cls,
        suggested_ru: dict[uz_s] || '',
      });
    }
  }
}

// Sort: missing first, then stub, then non-cyrillic; then by namespace; then by key.
const order = { missing: 0, stub: 1, 'non-cyrillic': 2 };
gaps.sort((a, b) =>
  order[a.classification] - order[b.classification]
  || a.namespace.localeCompare(b.namespace)
  || a.key.localeCompare(b.key),
);
const top = gaps.slice(0, TOP);

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(top, null, 2));
  process.exit(0);
}

const header = 'namespace,key,uz,ru_current,classification,suggested_ru\n';
const body = top.map((g) =>
  [g.namespace, g.key, g.uz, g.ru_current, g.classification, g.suggested_ru]
    .map(csvEscape).join(','),
).join('\n');
fs.writeFileSync(OUT_PATH, header + body + '\n', 'utf8');

const cls = (k) => top.filter((g) => g.classification === k).length;
console.log(`  Wrote ${top.length.toLocaleString()} gaps → ${path.relative(ROOT, OUT_PATH)}`);
console.log(`    missing      : ${cls('missing')}`);
console.log(`    stub         : ${cls('stub')}`);
console.log(`    non-cyrillic : ${cls('non-cyrillic')}`);
const withSuggestion = top.filter((g) => g.suggested_ru).length;
console.log(`    suggested    : ${withSuggestion} (from i18n-ru-manual-translations.json)`);
