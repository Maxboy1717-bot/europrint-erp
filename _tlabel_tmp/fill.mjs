// fill.mjs — Read extracted tLabel calls, group by namespace, fill missing
// nested keys into locales/{uz,uz-cyr,ru}/<ns>.json.
//
// Logic:
//   1. Load `extracted.json` (output of extract.mjs).
//   2. Group by ns. Deduplicate by (ns + path), keeping the first fallback seen.
//      Conflicting fallbacks for the same key are reported but the first wins.
//   3. For each ns, load uz/uz-cyr/ru json. Walk each (path, fallback):
//        - if uz missing: set fallback
//        - if uz-cyr missing: set translit(fallback)
//        - if ru missing: queue for Yandex (or use UZ literal for glossary-only text)
//   4. Yandex batch (up to 50 strings per call). On failure: leave ru missing
//      (don't write fallback as ru — that's worse than the warning).
//   5. Write back JSON pretty-formatted.
//
// Nested-key writing: path "LanguageSwitcher.tsx.ozbekcha" → JSON has
//   { "LanguageSwitcher.tsx": { "ozbekcha": "..." } }
// We split by '.' and ensure parent objects exist; never overwrite existing leaves.

import fs from 'node:fs';
import path from 'node:path';
import { translitLatToCyr } from './translit.mjs';

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module';
const LOCALES = `${ROOT}/artifacts/erp-dashboard/src/locales`;
const EXTRACTED = `${ROOT}/_tlabel_tmp/extracted.json`;
const REPORT = `${ROOT}/_tlabel_tmp/fill-report.json`;

const YANDEX_API_KEY = process.env.YANDEX_API_KEY ?? '';
const YANDEX_FOLDER_ID = 'b1gsmsn0lnbfh0pmqpvo';
const YANDEX_URL = 'https://translate.api.cloud.yandex.net/translate/v2/translate';

const BATCH_SIZE = 50;
const MAX_RETRIES = 2;

// Glossary tokens that should not be translated. If a string equals one of these
// (case-insensitive after trim), the RU value = the UZ literal.
const GLOSSARY_LITERAL = new Set([
  'EBITDA','JSHD','INPS','ZPL','BAT','EuroPrint','MacBook','iPad',
  'Instagram','Facebook','Telegram','WhatsApp','LinkedIn','GitHub','GitLab',
  'Google','OpenStreetMap','GPS','GPT','OpenAI','Yandex','Claude',
  'AI','ML','NLP','OCR','PDF','CSV','JSON','XML','API','URL','HTTP','HTTPS',
  'REST','GraphQL','WebSocket','JWT','OAuth','SSO','MFA','2FA','OTP',
  'KPI','OKR','MRP','ERP','CRM','WMS','MES','HR','BI','IoT','IT',
  'OEE','FIFO','LIFO','FEFO','ABC','FMCG','B2B','B2C','B2G','SLA','NPS',
  'ROI','CAC','LTV','MAU','DAU','SaaS','PaaS','IaaS',
].map(s => s.toLowerCase()));

function isGlossaryOnly(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  // If after stripping glossary tokens + punctuation/digits only whitespace remains: glossary-only.
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return true;
  return tokens.every(t => {
    const clean = t.replace(/[^A-Za-z0-9]/g, '');
    if (!clean) return true;
    return GLOSSARY_LITERAL.has(clean.toLowerCase()) || /^[0-9]+$/.test(clean);
  });
}

function readJson(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function writeJson(file, obj) {
  // Pretty-print: 2 spaces, sorted top-level keys? No — preserve insertion order
  // (existing files keep their layout; new keys appended at end of their parent).
  const out = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(file, out, 'utf8');
}

// Set value at dot-path in obj, only if not already present (deep).
// Returns true if a new leaf was created, false if already existed (no overwrite).
// If a parent path collides with a non-object value, we log and skip (cannot safely overwrite).
function setNested(obj, dotPath, value, conflicts) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined) {
      cur[p] = {};
    } else if (typeof cur[p] !== 'object' || cur[p] === null || Array.isArray(cur[p])) {
      conflicts.push({ path: dotPath, reason: `parent '${parts.slice(0, i + 1).join('.')}' is a non-object leaf`, existingValue: cur[p] });
      return false;
    }
    cur = cur[p];
  }
  const leaf = parts[parts.length - 1];
  if (cur[leaf] !== undefined) return false; // already present — never overwrite
  cur[leaf] = value;
  return true;
}

// Check if dot-path already exists (deep) in obj. Returns true if any non-undefined leaf.
function hasNested(obj, dotPath) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return false;
    if (!(p in cur)) return false;
    cur = cur[p];
  }
  return cur !== undefined && cur !== null;
}

async function yandexBatch(texts) {
  const body = JSON.stringify({
    folderId: YANDEX_FOLDER_ID,
    sourceLanguageCode: 'uz',
    targetLanguageCode: 'ru',
    format: 'PLAIN_TEXT',
    texts,
  });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(YANDEX_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${YANDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.translations)) throw new Error('No translations array');
      return data.translations.map(t => t.text);
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return [];
}

async function main() {
  const extracted = JSON.parse(fs.readFileSync(EXTRACTED, 'utf8'));
  console.log(`Loaded ${extracted.length} tLabel call records.`);

  // Group by ns -> Map<path, { fallback, sample: {file,line} }>
  const byNs = new Map();
  const conflicts = []; // same key, different fallbacks across callsites
  for (const r of extracted) {
    if (!byNs.has(r.ns)) byNs.set(r.ns, new Map());
    const m = byNs.get(r.ns);
    const existing = m.get(r.path);
    if (existing) {
      if (existing.fallback !== r.fallback) {
        conflicts.push({
          ns: r.ns,
          path: r.path,
          first: existing.fallback,
          firstAt: `${existing.file}:${existing.line}`,
          other: r.fallback,
          otherAt: `${r.file}:${r.line}`,
        });
      }
      continue;
    }
    m.set(r.path, { fallback: r.fallback, file: r.file, line: r.line });
  }

  console.log(`Unique namespaces: ${byNs.size}. Unique keys: ${[...byNs.values()].reduce((s, m) => s + m.size, 0)}`);
  if (conflicts.length) console.log(`Fallback conflicts (first-wins): ${conflicts.length}`);

  const report = {
    totalCalls: extracted.length,
    uniqueKeys: 0,
    namespacesProcessed: [],
    addedUz: 0,
    addedUzCyr: 0,
    addedRu: 0,
    yandexCalls: 0,
    yandexErrors: [],
    glossaryLiterals: 0,
    parentConflicts: [],
    fallbackConflicts: conflicts,
    samples: [],
  };

  for (const [ns, keyMap] of byNs.entries()) {
    const uzFile = `${LOCALES}/uz/${ns}.json`;
    const uzCyrFile = `${LOCALES}/uz-cyr/${ns}.json`;
    const ruFile = `${LOCALES}/ru/${ns}.json`;
    const uzObj = readJson(uzFile);
    const uzCyrObj = readJson(uzCyrFile);
    const ruObj = readJson(ruFile);
    if (uzObj === null || uzCyrObj === null || ruObj === null) {
      console.warn(`SKIP ns '${ns}' — missing locale files: uz=${!!uzObj} cyr=${!!uzCyrObj} ru=${!!ruObj}`);
      continue;
    }

    const parentConflicts = [];
    const ruQueue = []; // { dotPath, fallback }
    let addedUz = 0, addedUzCyr = 0;

    for (const [dotPath, info] of keyMap.entries()) {
      const fb = info.fallback;
      // UZ
      if (!hasNested(uzObj, dotPath)) {
        if (setNested(uzObj, dotPath, fb, parentConflicts)) addedUz++;
      }
      // UZ-CYR
      if (!hasNested(uzCyrObj, dotPath)) {
        const cyrValue = translitLatToCyr(fb);
        if (setNested(uzCyrObj, dotPath, cyrValue, parentConflicts)) addedUzCyr++;
      }
      // RU
      if (!hasNested(ruObj, dotPath)) {
        if (isGlossaryOnly(fb)) {
          if (setNested(ruObj, dotPath, fb, parentConflicts)) {
            report.glossaryLiterals++;
            report.addedRu++;
          }
        } else {
          ruQueue.push({ dotPath, fallback: fb });
        }
      }
    }

    // Batch-translate RU queue
    let ruAdded = 0;
    for (let i = 0; i < ruQueue.length; i += BATCH_SIZE) {
      const slice = ruQueue.slice(i, i + BATCH_SIZE);
      const texts = slice.map(s => s.fallback);
      report.yandexCalls++;
      try {
        const translations = await yandexBatch(texts);
        for (let j = 0; j < slice.length; j++) {
          const ru = translations[j];
          if (typeof ru === 'string' && ru.trim()) {
            if (setNested(ruObj, slice[j].dotPath, ru, parentConflicts)) {
              ruAdded++;
              report.addedRu++;
            }
          }
        }
      } catch (e) {
        report.yandexErrors.push({ ns, batchStart: i, error: String(e?.message || e) });
        console.warn(`Yandex error (ns=${ns}, batch=${i}):`, e?.message || e);
      }
    }

    writeJson(uzFile, uzObj);
    writeJson(uzCyrFile, uzCyrObj);
    writeJson(ruFile, ruObj);

    report.namespacesProcessed.push({
      ns,
      uniqueKeys: keyMap.size,
      addedUz,
      addedUzCyr,
      addedRu: ruAdded + (isGlossaryOnly_count(keyMap, ruObj)),
      parentConflicts: parentConflicts.length,
    });
    report.addedUz += addedUz;
    report.addedUzCyr += addedUzCyr;
    report.parentConflicts.push(...parentConflicts.map(c => ({ ns, ...c })));

    console.log(`ns=${ns.padEnd(18)} keys=${String(keyMap.size).padStart(4)} +uz=${addedUz} +cyr=${addedUzCyr} +ru=${ruAdded} ruQ=${ruQueue.length}`);
  }

  report.uniqueKeys = [...byNs.values()].reduce((s, m) => s + m.size, 0);

  // Pick 3 sample (file:line, key) where ru was newly added
  // Re-scan extracted for first 3 unique (ns, path) with a clear demonstration
  const seen = new Set();
  for (const r of extracted) {
    const k = `${r.ns}.${r.path}`;
    if (seen.has(k)) continue;
    seen.add(k);
    report.samples.push({
      key: k,
      file: r.file,
      line: r.line,
      uzFallback: r.fallback,
    });
    if (report.samples.length >= 3) break;
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');
  console.log('\n=== SUMMARY ===');
  console.log(`Total tLabel calls: ${report.totalCalls}`);
  console.log(`Unique keys:        ${report.uniqueKeys}`);
  console.log(`Namespaces touched: ${report.namespacesProcessed.length}`);
  console.log(`Added uz/uz-cyr/ru: ${report.addedUz} / ${report.addedUzCyr} / ${report.addedRu}`);
  console.log(`Yandex calls:       ${report.yandexCalls}`);
  console.log(`Yandex errors:      ${report.yandexErrors.length}`);
  console.log(`Glossary literals:  ${report.glossaryLiterals}`);
  console.log(`Parent conflicts:   ${report.parentConflicts.length}`);
  console.log(`Report:             ${REPORT}`);
}

// (Empty helper retained for symmetry; glossary-RU count already incremented inline)
function isGlossaryOnly_count() { return 0; }

main().catch(e => { console.error(e); process.exit(1); });
