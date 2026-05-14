#!/usr/bin/env node
/**
 * Apply manual UZ -> RU translations from two dictionary files:
 *   - scripts/i18n-ru-manual-translations.json (full phrases)
 *   - scripts/i18n-camelcase-translations.json (camelCase stub keys whose value equals the key)
 *
 * Walks every namespace in artifacts/erp-dashboard/src/locales/ru/*.json and replaces
 * matching string values in-place, preserving JSON structure and key parity.
 *
 * Whitelist words and any value already containing Cyrillic are left untouched.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const RU_LOCALES = path.join(ROOT, "artifacts/erp-dashboard/src/locales/ru");
const UZ_LOCALES = path.join(ROOT, "artifacts/erp-dashboard/src/locales/uz");
const DICT_FULL = path.join(ROOT, "scripts/i18n-ru-manual-translations.json");
const DICT_CAMEL = path.join(ROOT, "scripts/i18n-camelcase-translations.json");

const WHITELIST = new Set([
  "OK","API","URL","JWT","Email","ID","CSV","JSON","PDF","HTML","CSS","JS","TS","IP","EuroPrint","Telegram","WhatsApp",
  "CRM","ERP","HR","FI","PP","MES","QC","WMS","SD","MRO","POS","MM","LMS","SOS","KPI","RBAC","OEE","ROI","OTP","2FA",
  "SaaS","BOM","FIFO","FEFO","SQL","GPS","QR","B2B","B2C","CFO","CEO","CTO","UX","UI","CRUD","REST","PWA","JIT","IoT",
  "AI","GL","AP","AR","BI","CAD","CI","CD","SKU","UZS","USD","EUR","RUB","RFID","SMTP","SMS","PIN","VPN","DNS","SSL",
  "EBITDA","CMYK","RGB","Pantone","Photoshop","InDesign","EPS","TIFF","MQTT","Modbus","OPC-UA","HTTP","TOTP","SSL/TLS",
  "GDPR","SEO","ROA","D/E","DIO","ROP","TAC","AI CRM","Inline QC","Alumni","HR ↔ LMS","OEE Live","TELEGRAM","AI HR",
  "Tablet PWA","HR AI","Instagram","Facebook","LinkedIn","OpenStreetMap","Excel","Quick Ratio","Debt to Equity",
  "Debt to Assets","Adobe Illustrator","Gemini","OpenAI","Gemini Vision","Social API","EXTERNAL_IN","JPEG, PNG, WebP",
  "HR Performance AI","AI Predictive Engine","QC Extended","ZPL — Zebra ZPL II","EPL — Eltron EPL2","Inter Bold",
  "Inter Regular","GPT-4o Mini","Alfa-Tex LLC","Zavod LLC","HR — Offboarding","Checklist","ABC Company","MacBook Pro 14",
  "EuroPrint ERP","EuroPrint HR","Telegram ID","Apple, Samsung...","hh.uz, Telegram...","EuroPrint Paper..."
]);

function hasCyr(s) {
  if (typeof s !== "string") return false;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code >= 0x0400 && code <= 0x04FF) return true;
  }
  return false;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function walkTransform(obj, transformer) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (obj[i] && typeof obj[i] === "object") walkTransform(obj[i], transformer);
      else if (typeof obj[i] === "string") obj[i] = transformer(obj[i]);
    }
    return;
  }
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v && typeof v === "object") walkTransform(v, transformer);
      else if (typeof v === "string") obj[k] = transformer(v, k);
    }
  }
}

function flat(o, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(o || {})) {
    const kk = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flat(v, kk));
    else out[kk] = v;
  }
  return out;
}

const dictFull = loadJson(DICT_FULL);
const dictCamel = loadJson(DICT_CAMEL);

console.log(`Loaded ${Object.keys(dictFull).length} full-phrase translations`);
console.log(`Loaded ${Object.keys(dictCamel).length} camelCase translations`);

// Combined dict — full phrases take precedence, camelCase second.
const dict = { ...dictCamel, ...dictFull };

let totalReplaced = 0;
let totalChecked = 0;
const filesModified = [];

for (const fn of fs.readdirSync(RU_LOCALES).sort()) {
  if (!fn.endsWith(".json")) continue;
  const filePath = path.join(RU_LOCALES, fn);
  const data = loadJson(filePath);
  let replacedHere = 0;
  let checkedHere = 0;

  walkTransform(data, (value /* , key */) => {
    checkedHere++;
    if (hasCyr(value)) return value;
    if (WHITELIST.has(value.trim())) return value;
    if (dict[value] !== undefined) {
      replacedHere++;
      return dict[value];
    }
    // Also try trimmed
    const trimmed = value.trim();
    if (trimmed !== value && dict[trimmed] !== undefined) {
      replacedHere++;
      return dict[trimmed];
    }
    return value;
  });

  totalChecked += checkedHere;
  if (replacedHere > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    totalReplaced += replacedHere;
    filesModified.push({ fn, replaced: replacedHere });
  }
}

console.log(`\nTotal strings checked: ${totalChecked}`);
console.log(`Total replacements:    ${totalReplaced}`);
console.log(`Files modified:        ${filesModified.length}`);
for (const { fn, replaced } of filesModified.sort((a, b) => b.replaced - a.replaced)) {
  console.log(`  ${fn}: ${replaced}`);
}

// --- Verify JSON validity and key parity ---
console.log("\nVerifying JSON validity and key parity...");
let parityErrors = 0;
const namespaces = fs.readdirSync(RU_LOCALES).filter(f => f.endsWith(".json"));
for (const fn of namespaces) {
  let uz, ru;
  try {
    uz = loadJson(path.join(UZ_LOCALES, fn));
  } catch (e) {
    console.error(`UZ parse error: ${fn}: ${e.message}`);
    parityErrors++;
    continue;
  }
  try {
    ru = loadJson(path.join(RU_LOCALES, fn));
  } catch (e) {
    console.error(`RU parse error: ${fn}: ${e.message}`);
    parityErrors++;
    continue;
  }
  const uzKeys = Object.keys(flat(uz)).sort();
  const ruKeys = Object.keys(flat(ru)).sort();
  if (uzKeys.length !== ruKeys.length) {
    console.error(`Key count mismatch ${fn}: uz=${uzKeys.length} ru=${ruKeys.length}`);
    parityErrors++;
    continue;
  }
  for (let i = 0; i < uzKeys.length; i++) {
    if (uzKeys[i] !== ruKeys[i]) {
      console.error(`Key mismatch ${fn} at #${i}: uz=${uzKeys[i]} ru=${ruKeys[i]}`);
      parityErrors++;
      break;
    }
  }
}
console.log(parityErrors === 0 ? "Key parity OK." : `Parity errors: ${parityErrors}`);

// --- Coverage calculation ---
let ruTotal = 0;
let ruCyr = 0;
for (const fn of namespaces) {
  const ru = loadJson(path.join(RU_LOCALES, fn));
  const flatRu = flat(ru);
  for (const v of Object.values(flatRu)) {
    if (typeof v !== "string") continue;
    ruTotal++;
    if (hasCyr(v) || v.length <= 1 || WHITELIST.has(v.trim())) ruCyr++;
  }
}
const coverage = ruTotal > 0 ? ((ruCyr / ruTotal) * 100).toFixed(2) : "0";
console.log(`\nRU coverage: ${ruCyr}/${ruTotal} (${coverage}%) [Cyrillic or whitelist]`);
