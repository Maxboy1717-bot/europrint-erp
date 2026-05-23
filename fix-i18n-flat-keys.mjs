#!/usr/bin/env node
/**
 * fix-i18n-flat-keys.mjs — Walk JSON locale files DIRECTLY (no flattening),
 *   remove broken key===value entries where the key looks like human text.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const UZ_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/uz');
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');

function isBrand(value) {
  if (typeof value !== 'string') return false;
  const patterns = [
    /^(API|ID|HTTP|HTTPS|URL|CSV|JSON|XML|PDF|HTML|CSS|JS|TS|SQL|REST|GraphQL|OK|UI|UX|AI|ML|IoT|QC|HR|CRM|ERP|POS|MES|WMS|LMS|MM|BI|KPI|OEE|ABC|MRP|ROI|CR|SQ|UZ|RU|EN|US)$/,
    /^(EuroPrint|WhatsApp|Telegram|Gmail|Outlook|Slack|Notion|Stripe|PayPal|Zoom)/,
    /^(Gemini|GPT|Claude|OpenAI|Anthropic|Google|Microsoft|Meta|Apple|Amazon)/,
  ];
  for (const re of patterns) if (re.test(value)) return true;
  return false;
}

// Determine if a key looks like "human text" (broken codemod artifact)
// vs a code identifier (camelCase / snake_case / namespace.code)
function isHumanTextKey(key) {
  // Definitely human if has spaces, ?, !, , or ellipsis
  if (/[\s?!,…]/.test(key)) return true;
  if (key.endsWith('...')) return true;
  // If starts with uppercase letter AND has lowercase letters in main word
  if (/^[A-Z][a-z]/.test(key) && !key.includes('.')) return true;
  return false;
}

let removed = 0;

function processNode(uzNode, ruNode) {
  for (const key of Object.keys(uzNode)) {
    const uzVal = uzNode[key];
    if (typeof uzVal === 'string') {
      // Check if broken: key === value AND key looks human
      if (key === uzVal && isHumanTextKey(key) && !isBrand(uzVal)) {
        delete uzNode[key];
        if (ruNode && key in ruNode) delete ruNode[key];
        removed++;
      }
    } else if (typeof uzVal === 'object' && uzVal !== null) {
      processNode(uzVal, ruNode?.[key] ?? null);
    }
  }
}

for (const fname of fs.readdirSync(UZ_DIR)) {
  if (!fname.endsWith('.json')) continue;
  const uzPath = path.join(UZ_DIR, fname);
  const ruPath = path.join(RU_DIR, fname);
  if (!fs.existsSync(ruPath)) continue;

  const uz = JSON.parse(fs.readFileSync(uzPath, 'utf8'));
  const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

  processNode(uz, ru);

  fs.writeFileSync(uzPath, JSON.stringify(uz, null, 2) + '\n');
  fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2) + '\n');
}

console.log(`Removed ${removed} broken human-text keys (key === value)`);
