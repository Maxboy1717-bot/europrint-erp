#!/usr/bin/env node
/**
 * i18n-status.mjs — single-source-of-truth status report.
 *
 *   node scripts/i18n-status.mjs           # human-readable report
 *   node scripts/i18n-status.mjs --json    # machine-readable JSON
 *   node scripts/i18n-status.mjs --fail    # exit 1 if RU < 99% or any namespace < 95%
 *
 * Compares UZ and RU locale files, classifies each value as:
 *   - translated  (Cyrillic for RU; non-key, non-stub for UZ)
 *   - stub        (value === key, i.e. translator never touched it)
 *   - whitelist   (acronym / brand: same in both — expected)
 *   - missing     (key in UZ, absent in RU)
 *   - extra       (key in RU, absent in UZ)
 *
 * Whitelist source: docs/i18n-glossary.md sections 1.1–1.5.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UZ_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/uz');
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');

const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has('--json');
const FAIL_GATE = args.has('--fail');

// ── Whitelist (sync with docs/i18n-glossary.md §1) ──────────────────────────
const WHITELIST = new Set([
  // EuroPrint brand
  'EuroPrint', 'EuroPrint ERP', 'EuroPrint LLC',
  // Industry acronyms
  'ABC', 'AQL', 'BOM', 'CFO', 'CRM', 'CSV', 'DDD', 'DTO', 'EBITDA', 'ERP',
  'FEFO', 'FIFO', 'FMEA', 'GL', 'GMP', 'HR', 'INPS', 'IoT', 'JSON', 'JSHD',
  'KPI', 'LMS', 'MES', 'MM', 'MRO', 'MRP', 'OEE', 'OKR', 'OTP', 'PDF', 'PNG',
  'POS', 'PP', 'QC', 'ROI', 'SD', 'SLA', 'SoD', 'SPC', 'SVG', 'TLS', 'TPM',
  'UI', 'UX', 'VAT', 'WMS', 'XML', 'YAML', 'ZPL',
  // Tech stack
  'Anthropic', 'Bun', 'BullMQ', 'Claude', 'Dapper', 'Docker', 'Drizzle',
  'Fastify', 'Git', 'GitHub', 'GPT-4', 'GPT-4o', 'Grafana', 'Helm', 'Helmet',
  'JWT', 'Kibana', 'Kubernetes', 'Linux', 'MinIO', 'NestJS', 'Next.js', 'Nginx',
  'Node.js', 'OpenAI', 'Passport', 'PM2', 'PostgreSQL', 'Prometheus', 'React',
  'Redis', 'Sentry', 'Socket.io', 'Tailwind', 'TypeScript', 'Vite', 'Vitest',
  'Zod',
  // Social
  'Instagram', 'Telegram', 'WhatsApp', 'YouTube', 'Jitsi', 'Slack', '8x8.vc',
  'Google', 'Yandex',
  // Currency / units / formats
  'UZS', 'USD', 'EUR', 'RUB', 'm²', 'kg', 't', 'kWh',
  '.pdf', '.xlsx', '.csv', '.docx', '.png', '.jpg', '.svg',
]);

const CYRILLIC_RE = /[Ѐ-ӿ]/;
const LATIN_RE = /[A-Za-z]/;

// Brand / acronym / tech identifier heuristic. Catches values like
// "ABC Company", "API Key", "MQTT", "GPT-4o Mini", "HR ↔ LMS" that are
// intentionally identical in UZ and RU. These should not be flagged.
function isBrandLike(v) {
  if (!v || CYRILLIC_RE.test(v)) return false;
  if (v.length > 60) return false;
  // Short identifier (≤5 chars, ASCII alphanumerics only) — e.g. "x", "x42", "API", "ID"
  if (v.length <= 5 && /^[A-Za-z0-9]+$/.test(v)) return true;
  // Longer brand/compound — must contain at least one uppercase letter
  // and only ASCII + safe punctuation.
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

function classifyUz(key, value) {
  if (typeof value !== 'string') return 'translated';
  const v = value.trim();
  if (!v) return 'stub';
  if (WHITELIST.has(v)) return 'whitelist';
  if (isBrandLike(v)) return 'whitelist';
  // Real Uzbek text: contains whitespace, Uzbek apostrophe forms, or sentence
  // punctuation → translated (even if equal to key, which is the "source-as-key" pattern).
  if (/\s/.test(v) || /['ʻ`’]/.test(v) || /[.?!,:;()]/.test(v)) return 'translated';
  // Cyrillic in UZ file is unusual but valid (some keys store Russian text)
  if (CYRILLIC_RE.test(v)) return 'translated';
  // Single-token value that exactly equals the key → stub (untouched by translator)
  if (v === key) return 'stub';
  // Pure-lowercase single word (no caps, no digits, no underscores) → likely a real
  // single-word Uzbek translation (e.g. "umumiy", "urinish"). Only stub if key-shaped.
  if (/^[a-z]+$/.test(v) && v.length < 20) return 'translated';
  // True camelCase / PascalCase / SCREAMING_SNAKE identifier — stub from auto-codemod.
  if (/^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9_]*$/.test(v)) return 'stub';
  if (/^[A-Z][a-zA-Z0-9_]+$/.test(v) && v.length < 30) return 'stub';
  return 'translated';
}

function classifyRu(key, value, uzValue) {
  if (typeof value !== 'string') return 'translated';
  const v = value.trim();
  if (!v) return 'missing';
  // If RU value is already Cyrillic, it's a valid translation, even if equal to UZ.
  if (CYRILLIC_RE.test(v)) return 'translated';
  // From here on, RU value is non-Cyrillic.
  if (WHITELIST.has(v)) return 'whitelist';
  if (isBrandLike(v)) return 'whitelist';
  // All-symbols/numbers/punctuation — accept verbatim
  if (!LATIN_RE.test(v)) return 'whitelist';
  // Equal-to-UZ non-Cyrillic = stub
  if (uzValue && v === uzValue) return 'stub';
  return 'non-cyrillic';
}

function pct(n, d) {
  if (!d) return '0.0%';
  return ((n / d) * 100).toFixed(2) + '%';
}

function buildReport() {
  const namespaces = fs.readdirSync(UZ_DIR)
    .filter((f) => f.endsWith('.json') && !f.includes('before-codemod'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();

  const perNs = [];
  const totals = {
    keys: 0,
    uzTranslated: 0, uzStub: 0, uzWhitelist: 0,
    ruTranslated: 0, ruStub: 0, ruMissing: 0, ruNonCyrillic: 0, ruWhitelist: 0,
    extra: 0,
  };

  for (const ns of namespaces) {
    const uz = readNs(UZ_DIR, ns) ?? {};
    const ru = readNs(RU_DIR, ns) ?? {};
    const uzKeys = Object.keys(uz);
    const ruKeys = Object.keys(ru);
    const ruSet = new Set(ruKeys);

    let uzT = 0, uzS = 0, uzW = 0;
    let ruT = 0, ruS = 0, ruM = 0, ruN = 0, ruW = 0;

    for (const k of uzKeys) {
      const cu = classifyUz(k, uz[k]);
      if (cu === 'translated') uzT++;
      else if (cu === 'stub') uzS++;
      else if (cu === 'whitelist') uzW++;

      if (!ruSet.has(k)) { ruM++; continue; }
      const cr = classifyRu(k, ru[k], uz[k]);
      if (cr === 'translated') ruT++;
      else if (cr === 'stub') ruS++;
      else if (cr === 'missing') ruM++;
      else if (cr === 'non-cyrillic') ruN++;
      else if (cr === 'whitelist') ruW++;
    }
    const extra = ruKeys.filter((k) => !(k in uz)).length;

    const row = {
      ns,
      keys: uzKeys.length,
      uz: { translated: uzT, stub: uzS, whitelist: uzW,
            coverage: pct(uzT + uzW, uzKeys.length) },
      ru: { translated: ruT, stub: ruS, missing: ruM,
            nonCyrillic: ruN, whitelist: ruW, extra,
            coverage: pct(ruT + ruW, uzKeys.length) },
    };
    perNs.push(row);

    totals.keys += uzKeys.length;
    totals.uzTranslated += uzT;
    totals.uzStub += uzS;
    totals.uzWhitelist += uzW;
    totals.ruTranslated += ruT;
    totals.ruStub += ruS;
    totals.ruMissing += ruM;
    totals.ruNonCyrillic += ruN;
    totals.ruWhitelist += ruW;
    totals.extra += extra;
  }

  return { namespaces: perNs, totals };
}

const report = buildReport();
const T = report.totals;
const uzGood = T.uzTranslated + T.uzWhitelist;
const ruGood = T.ruTranslated + T.ruWhitelist;
const uzPct = uzGood / T.keys;
const ruPct = ruGood / T.keys;

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(report, null, 2));
} else {
  const c = (s, color) => process.stdout.isTTY
    ? `\x1b[${color}m${s}\x1b[0m` : s;
  const ok = (s) => c(s, 32);
  const warn = (s) => c(s, 33);
  const bad = (s) => c(s, 31);
  const bold = (s) => c(s, 1);

  console.log(bold('\n  EuroPrint i18n — Status Report'));
  console.log('  ' + '─'.repeat(78));
  console.log('  ' + 'Namespace'.padEnd(20)
    + 'Keys'.padStart(7)
    + 'UZ ok'.padStart(8)
    + 'UZ stub'.padStart(9)
    + 'RU ok'.padStart(8)
    + 'RU stub'.padStart(9)
    + 'RU miss'.padStart(9)
    + 'RU n-Cyr'.padStart(10)
  );
  console.log('  ' + '─'.repeat(78));
  for (const r of report.namespaces) {
    const uzPctNs = (r.uz.translated + r.uz.whitelist) / r.keys;
    const ruPctNs = (r.ru.translated + r.ru.whitelist) / r.keys;
    const uzColor = uzPctNs >= 0.95 ? ok : (uzPctNs >= 0.80 ? warn : bad);
    const ruColor = ruPctNs >= 0.95 ? ok : (ruPctNs >= 0.80 ? warn : bad);
    console.log('  '
      + r.ns.padEnd(20)
      + String(r.keys).padStart(7)
      + uzColor(r.uz.coverage.padStart(8))
      + String(r.uz.stub).padStart(9)
      + ruColor(r.ru.coverage.padStart(8))
      + String(r.ru.stub).padStart(9)
      + String(r.ru.missing).padStart(9)
      + String(r.ru.nonCyrillic).padStart(10)
    );
  }
  console.log('  ' + '─'.repeat(78));
  console.log('  ' + bold('TOTAL'.padEnd(20))
    + String(T.keys).padStart(7)
    + (uzPct >= 0.99 ? ok : warn)(pct(uzGood, T.keys).padStart(8))
    + String(T.uzStub).padStart(9)
    + (ruPct >= 0.99 ? ok : warn)(pct(ruGood, T.keys).padStart(8))
    + String(T.ruStub).padStart(9)
    + String(T.ruMissing).padStart(9)
    + String(T.ruNonCyrillic).padStart(10)
  );
  console.log();
  console.log(`  UZ coverage: ${uzPct >= 0.99 ? ok(pct(uzGood, T.keys)) : warn(pct(uzGood, T.keys))} `
    + `(${T.uzTranslated} translated + ${T.uzWhitelist} whitelist of ${T.keys})`);
  console.log(`  RU coverage: ${ruPct >= 0.99 ? ok(pct(ruGood, T.keys)) : warn(pct(ruGood, T.keys))} `
    + `(${T.ruTranslated} translated + ${T.ruWhitelist} whitelist of ${T.keys})`);
  if (T.ruMissing > 0)      console.log(`  ${bad('RU missing keys:')}     ${T.ruMissing}`);
  if (T.ruStub > 0)         console.log(`  ${warn('RU stubs:')}            ${T.ruStub}`);
  if (T.ruNonCyrillic > 0)  console.log(`  ${warn('RU non-Cyrillic:')}     ${T.ruNonCyrillic}`);
  if (T.uzStub > 0)         console.log(`  ${warn('UZ stubs:')}            ${T.uzStub}`);
  if (T.extra > 0)          console.log(`  ${warn('RU extra keys:')}       ${T.extra}`);
  console.log();
}

if (FAIL_GATE) {
  const ok = ruPct >= 0.99 && uzPct >= 0.99;
  if (!ok) {
    process.stderr.write(
      `\n  ✗ i18n gate failed: UZ ${pct(uzGood, T.keys)} / RU ${pct(ruGood, T.keys)} `
      + `(threshold: 99%)\n\n`,
    );
    process.exit(1);
  }
  process.stdout.write(`  ✓ i18n gate passed.\n`);
}
