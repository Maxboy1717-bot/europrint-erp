#!/usr/bin/env node
/**
 * i18n-fix-final-ru-gaps.mjs — apply a targeted dictionary to plug the
 * remaining ~126 RU gaps (80 stubs + 46 non-Cyrillic).
 *
 * Strategy:
 *   1. Real terms → translate to Russian (Email, Quick Ratio, …)
 *   2. Brand / acronym / standard / file format → leave as-is (whitelist)
 *   3. Obviously-broken garbage keys (`await apiRequest`, `& VariantProps`,
 *      identifier-shaped values from auto-codemod) → delete from BOTH locales
 *
 * Run:
 *   node scripts/i18n-fix-final-ru-gaps.mjs           # apply
 *   node scripts/i18n-fix-final-ru-gaps.mjs --dry     # show diff only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UZ_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/uz');
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');
const DRY = process.argv.includes('--dry');

// Map: "{namespace}/{key}" → "<value>"  OR  null to delete from both files.
// (Using ns+key for precision so we don't clobber the same key in other ns.)
const PATCHES = {
  // === ADMIN ===
  'admin/api':                              { ru: 'API' },                      // whitelist-as-is
  'admin/email':                            { ru: 'Электронная почта' },

  // === AUTH ===
  'auth/register.email':                    { ru: 'Электронная почта' },

  // === COMMON (real terms) ===
  'common/applicationInfoPlaceholder':      null,  // already in RU file, false positive removed by classifier fix
  'common/bottom27Label':                   { ru: 'Нижние 27%:' },
  'common/debtToAssets':                    { ru: 'Долг к активам' },
  'common/debtToEquity':                    { ru: 'Долг к капиталу' },
  'common/descriptionRussianPlaceholder':   null,  // already RU
  'common/email1':                          { ru: 'Электронная почта' },
  'common/forFetchFailures':                { ru: 'для сбоев загрузки,' },
  'common/hrEmail':                         { ru: 'HR email' },
  'common/id':                              { ru: 'ID' },
  'common/introBasicsPlaceholder':          null,  // already RU
  'common/jpegPngWebp':                     { ru: 'JPEG, PNG, WebP' },
  'common/kr20PercentLabel':                { ru: 'KR-20 %' },
  'common/language.ru':                     { ru: 'Русский' },
  'common/lessonContentPlaceholder':        null,  // already RU
  'common/quickRatio':                      { ru: 'Коэффициент быстрой ликвидности' },
  'common/scanBarcodeToAddProducts':        { ru: 'Сканируйте штрих-код для добавления товаров' },
  'common/top27Label':                      { ru: 'Верхние 27%:' },
  'common/abcCompany':                      { ru: 'ABC Company' },
  'common/alfaTexLlc':                      { ru: 'Alfa-Tex LLC' },
  'common/zavodLlc':                        { ru: 'Zavod LLC' },
  'common/europrintPaper':                  { ru: 'EuroPrint Paper...' },
  'common/europrintHr':                     { ru: 'EuroPrint HR' },
  'common/hrCapital9':                      { ru: 'HR Capital №9' },
  'common/hrOffboarding':                   { ru: 'HR — Offboarding' },
  'common/hrPerformanceAi':                 { ru: 'HR Performance AI' },
  'common/aiPredictiveEngine':              { ru: 'AI Predictive Engine' },
  'common/apiKey':                          { ru: 'API Key' },
  'common/apiSecret':                       { ru: 'API Secret' },
  'common/appleSamsung':                    { ru: 'Apple, Samsung…' },
  'common/bin':                             { ru: '🗂 Корзина' },
  'common/boomerangHire':                   { ru: '🔄 Бумеранг-найм' },
  'common/checkIn':                         { ru: '➕ Регистрация' },
  'common/eplEltronEpl2':                   { ru: 'EPL — Eltron EPL2' },
  'common/geminiVision':                    { ru: 'Gemini Vision' },
  'common/gpt4oMini':                       { ru: 'GPT-4o Mini' },
  'common/hhUzTelegram':                    { ru: 'hh.uz, Telegram…' },
  'common/interBold':                       { ru: 'Inter Bold' },
  'common/interRegular':                    { ru: 'Inter Regular' },
  'common/qcExtended':                      { ru: 'QC Extended' },
  'common/socialApi':                       { ru: 'Social API' },
  'common/telegramId':                      { ru: 'Telegram ID' },
  'common/telegramInstagram':               { ru: 'Telegram, Instagram…' },
  'common/webhookSecret':                   { ru: 'Webhook Secret' },
  'common/zplZebraZplIi':                   { ru: 'ZPL — Zebra ZPL II' },
  'common/alumni':                          { ru: 'Выпускники' },
  'common/blockedByMaterial':               { ru: 'Заблокировано материалом' },
  'common/checklist':                       { ru: 'Чек-лист' },
  'common/col_dio':                         { ru: 'DIO' },
  'common/col_rop':                         { ru: 'ROP' },
  'common/excel':                           { ru: 'Excel' },
  'common/facebook':                        { ru: 'Facebook' },
  'common/gemini':                          { ru: 'Gemini' },
  'common/linkedin':                        { ru: 'LinkedIn' },
  'common/O':                               { ru: 'O' },
  'common/openstreetmap':                   { ru: 'OpenStreetMap' },
  'common/slug':                            { ru: 'Слаг' },
  'common/SOS':                             { ru: 'SOS' },
  'common/webhookUrllar':                   { ru: 'URL вебхука' },
  'common/x42':                             { ru: 'x42' },

  // Garbage from i18n auto-codemod — delete BOTH locales
  'common/aOverdueHours':                   null,
  'common/awaitApirequest':                 null,
  'common/completionRateAverageScore':      null,
  'common/constTransitionsRecord':          null,
  'common/divBgDestructiveProgresspct':     null,
  'common/externalIn':                      null,
  'common/iserror':                         null,
  'common/isout':                           null,
  'common/k0Camerarejections':              null,
  'common/k0Candidatecount':                null,
  'common/k0Salexpmax':                     null,
  'common/k0Taskstartoffset':               null,
  'common/k1WelcomeBanner':                 null,
  'common/lMaterialcodeLQty':               null,
  'common/tAchievementpct':                 null,
  'common/uclDValue':                       null,
  'common/variantprops':                    null,
  'common/wUtilizationpct':                 null,

  // === CRM ===
  'crm/emailSource':                        { ru: 'Электронная почта' },
  'crm/emailType':                          { ru: 'Электронная почта' },
  'crm/activity.email':                     { ru: 'Электронная почта' },
  'crm/activityType.email':                 { ru: 'Электронная почта' },
  'crm/contact.email':                      { ru: 'Электронная почта' },
  'crm/email':                              { ru: 'Электронная почта' },

  // === DESIGN ===
  'design/ai':                              { ru: 'Adobe Illustrator' },
  'design/cmyk':                            { ru: 'CMYK' },
  'design/indd':                            { ru: 'InDesign' },
  'design/psd':                             { ru: 'Photoshop' },
  'design/rgb':                             { ru: 'RGB' },
  'design/eps':                             { ru: 'EPS' },
  'design/pantone':                         { ru: 'Pantone' },
  'design/tiff':                            { ru: 'TIFF' },

  // === FINANCE ===
  'finance/cfo.altman.de':                  { ru: 'D/E' },
  'finance/cfo.altman.title':               { ru: 'Altman Z-Score' },
  'finance/cfo.cashflow.mSuffix':           { ru: 'млн' },
  'finance/cfo.altman.roa':                 { ru: 'ROA' },
  'finance/excel':                          { ru: 'Excel' },
  'finance/quickRatio':                     { ru: 'Quick Ratio' },
  'finance/xSuffix':                        { ru: 'x' },

  // === HR ===
  'hr/employee.email':                      { ru: 'Электронная почта' },

  // === IOT ===
  'iot/mqtt':                               { ru: 'MQTT' },
  'iot/opcua':                              { ru: 'OPC-UA' },
  'iot/http':                               { ru: 'HTTP' },
  'iot/modbus':                             { ru: 'Modbus' },

  // === MARKETING ===
  'marketing/seo':                          { ru: 'SEO' },

  // === NAVIGATION ===
  'navigation/AI CRM':                      { ru: 'AI CRM' },
  'navigation/Alumni':                      { ru: 'Выпускники' },
  'navigation/HR ↔ LMS':                    { ru: 'HR ↔ LMS' },
  'navigation/HR AI':                       { ru: 'AI HR' },
  'navigation/Inline QC':                   { ru: 'Inline QC' },
  'navigation/OEE Live':                    { ru: 'OEE Live' },
  'navigation/Tablet PWA':                  { ru: 'Tablet PWA' },
  'navigation/TELEGRAM':                    { ru: 'TELEGRAM' },

  // === PRINT ===
  'print/tacLabel':                         { ru: 'TAC' },

  // === PRODUCTION ===
  'production/abcCompany':                  { ru: 'ABC Company' },

  // === PUBLIC ===
  'public/contact.email':                   { ru: 'Электронная почта' },
  'public/contact.form.email':              { ru: 'Электронная почта' },
  'public/login.email':                     { ru: 'Электронная почта' },
  'public/order.email':                     { ru: 'Электронная почта' },

  // === SECURITY ===
  'security/gdpr':                          { ru: 'GDPR' },
  'security/ssl':                           { ru: 'SSL/TLS' },
  'security/totp':                          { ru: 'TOTP' },

  // === SETTINGS ===
  'settings/gpt4oMini':                     { ru: 'GPT-4o Mini' },

  // === WAREHOUSE / WMS ===
  'warehouse/inventory.sku':                { ru: 'SKU' },
  'wms/col_rop':                            { ru: 'ROP' },
};

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, obj) {
  if (DRY) return;
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
// Set a nested key by dot-path, creating intermediate objects as needed.
function setDeep(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}
function delDeep(obj, dotPath) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur[k] || typeof cur[k] !== 'object') return false;
    cur = cur[k];
  }
  if (parts[parts.length - 1] in cur) {
    delete cur[parts[parts.length - 1]];
    return true;
  }
  return false;
}
function hasDeep(obj, dotPath) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur || typeof cur !== 'object' || !(k in cur)) return false;
    cur = cur[k];
  }
  return cur && typeof cur === 'object' && parts[parts.length - 1] in cur;
}

const byNs = {};
for (const id of Object.keys(PATCHES)) {
  const [ns, ...rest] = id.split('/');
  const key = rest.join('/');
  (byNs[ns] ||= []).push({ key, patch: PATCHES[id] });
}

let totalUpdated = 0, totalDeleted = 0, totalSkipped = 0;
for (const [ns, items] of Object.entries(byNs)) {
  const uzPath = path.join(UZ_DIR, `${ns}.json`);
  const ruPath = path.join(RU_DIR, `${ns}.json`);
  if (!fs.existsSync(uzPath) || !fs.existsSync(ruPath)) {
    console.warn(`  skip: ${ns} (missing locale file)`);
    continue;
  }
  const uz = readJson(uzPath);
  const ru = readJson(ruPath);
  let updatedNs = 0, deletedNs = 0, skippedNs = 0;

  for (const { key, patch } of items) {
    if (patch === null) {
      const a = delDeep(uz, key);
      const b = delDeep(ru, key);
      if (a || b) { deletedNs++; totalDeleted++; }
      else { skippedNs++; totalSkipped++; }
      continue;
    }
    if (patch.ru !== undefined) {
      if (!hasDeep(uz, key)) {
        // Add to UZ too if missing, using RU value as fallback.
        setDeep(uz, key, patch.ru);
      }
      setDeep(ru, key, patch.ru);
      updatedNs++;
      totalUpdated++;
    }
  }
  writeJson(uzPath, uz);
  writeJson(ruPath, ru);
  console.log(`  ${ns.padEnd(15)} updated=${updatedNs}  deleted=${deletedNs}  skipped=${skippedNs}`);
}
console.log();
console.log(`  TOTAL: updated=${totalUpdated} deleted=${totalDeleted} skipped=${totalSkipped}`
  + (DRY ? '  (DRY-RUN — no files changed)' : ''));
