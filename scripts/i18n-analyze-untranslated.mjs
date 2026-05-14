#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const LOCALES = "artifacts/erp-dashboard/src/locales/ru";
const WHITELIST = new Set([
  "OK","API","URL","JWT","Email","ID","CSV","JSON","PDF","HTML","CSS","JS","TS","IP","EuroPrint","Telegram","WhatsApp",
  "CRM","ERP","HR","FI","PP","MES","QC","WMS","SD","MRO","POS","MM","LMS","SOS","KPI","RBAC","OEE","ROI","OTP","2FA",
  "SaaS","BOM","FIFO","FEFO","SQL","GPS","QR","B2B","B2C","CFO","CEO","CTO","UX","UI","CRUD","REST","PWA","JIT","IoT",
  "AI","GL","AP","AR","BI","CAD","CI","CD","SKU","UZS","USD","EUR","RUB","RFID","SMTP","SMS","PIN","VPN","DNS","SSL",
  "EBITDA","CMYK","RGB","Pantone","Photoshop","InDesign","EPS","TIFF","MQTT","Modbus","OPC-UA","HTTP","TOTP","SSL/TLS",
  "GDPR","SEO","ROA","D/E","DIO","ROP","TAC","Instagram","Facebook","LinkedIn","OpenStreetMap","Excel","Gemini","OpenAI"
]);

function flat(o, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(o || {})) {
    const kk = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flat(v, kk));
    else out[kk] = v;
  }
  return out;
}

function hasCyr(s) {
  if (typeof s !== "string") return false;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code >= 0x0400 && code <= 0x04FF) return true;
  }
  return false;
}

let total = 0;
const byNamespace = [];
const allUntranslated = {};

for (const fn of fs.readdirSync(LOCALES).sort()) {
  if (!fn.endsWith(".json")) continue;
  const filePath = path.join(LOCALES, fn);
  const raw = fs.readFileSync(filePath, "utf-8");
  const d = flat(JSON.parse(raw));
  const needs = [];
  for (const [k, v] of Object.entries(d)) {
    if (typeof v !== "string") continue;
    if (hasCyr(v)) continue;
    if (v.length <= 1) continue;
    if (WHITELIST.has(v.trim())) continue;
    needs.push([k, v]);
  }
  if (needs.length > 0) {
    total += needs.length;
    byNamespace.push({ fn, count: needs.length, samples: needs });
    allUntranslated[fn] = needs;
  }
}

console.log(`TOTAL UNTRANSLATED: ${total}`);
console.log(`NAMESPACES WITH UNTRANSLATED (${byNamespace.length}):`);
for (const { fn, count } of byNamespace.sort((a, b) => b.count - a.count)) {
  console.log(`  ${fn}: ${count}`);
}

fs.writeFileSync("scripts/i18n-untranslated-by-ns.json", JSON.stringify(allUntranslated, null, 2), "utf-8");
console.log("\nWrote scripts/i18n-untranslated-by-ns.json");
