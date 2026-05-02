#!/usr/bin/env node
/**
 * i18n parity checker — verifies UZ/RU locale files have identical key sets.
 * - Bidirectional: detects extra keys in RU not found in UZ, and vice versa
 * - Bidirectional file parity: detects locale files present in one lang but not the other
 * - Recursive: handles nested objects via flattenKeys()
 */
const fs = require("fs");
const path = require("path");

const uzDir = path.join(__dirname, "../src/locales/uz");
const ruDir = path.join(__dirname, "../src/locales/ru");

function flattenKeys(obj, prefix) {
  if (!prefix) prefix = "";
  return Object.entries(obj).flatMap(function([k, v]) {
    const full = prefix ? prefix + "." + k : k;
    return typeof v === "object" && v !== null && !Array.isArray(v)
      ? flattenKeys(v, full)
      : [full];
  });
}

const uzFiles = new Set(fs.readdirSync(uzDir).filter(function(f) { return f.endsWith(".json"); }));
const ruFiles = new Set(fs.readdirSync(ruDir).filter(function(f) { return f.endsWith(".json"); }));

let missing = 0;

for (const f of uzFiles) {
  if (!ruFiles.has(f)) { console.log("RU MISSING FILE: " + f); missing++; }
}
for (const f of ruFiles) {
  if (!uzFiles.has(f)) { console.log("UZ MISSING FILE: " + f); missing++; }
}

for (const f of uzFiles) {
  if (!ruFiles.has(f)) continue;
  const uz = flattenKeys(JSON.parse(fs.readFileSync(path.join(uzDir, f), "utf8")));
  const ru = flattenKeys(JSON.parse(fs.readFileSync(path.join(ruDir, f), "utf8")));
  const uzSet = new Set(uz), ruSet = new Set(ru);
  uz.filter(function(k) { return !ruSet.has(k); }).forEach(function(k) { console.log("MISSING RU " + f + ": " + k); missing++; });
  ru.filter(function(k) { return !uzSet.has(k); }).forEach(function(k) { console.log("MISSING UZ " + f + ": " + k); missing++; });
}

const total = Array.from(uzFiles).reduce(function(acc, f) {
  try { return acc + flattenKeys(JSON.parse(fs.readFileSync(path.join(uzDir, f), "utf8"))).length; }
  catch(e) { return acc; }
}, 0);

if (missing === 0) {
  console.log("✅ 0 missing keys — all " + uzFiles.size + " modules synced (" + total + " total keys)");
  process.exit(0);
} else {
  console.log("❌ " + missing + " missing keys");
  process.exit(1);
}
