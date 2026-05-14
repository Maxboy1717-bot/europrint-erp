#!/usr/bin/env node
/**
 * @module migrate-status-badges
 * @description Migrate common Tailwind-coloured `<Badge>` calls used for
 *   status indicators over to `<EPStatusPill>`. Only handles unambiguous
 *   cases — anything ambiguous is left alone for manual review.
 *
 *   Patterns it rewrites:
 *
 *     <Badge variant="default">Faol</Badge>           → <EPStatusPill tone="success">Faol</EPStatusPill>
 *     <Badge variant="secondary">Nofaol</Badge>       → <EPStatusPill tone="neutral">Nofaol</EPStatusPill>
 *     <Badge variant="destructive">Bekor qilingan</Badge> → <EPStatusPill tone="danger">…</EPStatusPill>
 *
 *   Also handles the bg-green-/yellow-/red-/blue-500 colour pattern:
 *
 *     <Badge className="bg-green-500">Faol</Badge>    → <EPStatusPill tone="success">…</EPStatusPill>
 *     <Badge className="bg-yellow-500">Kutilmoqda</Badge> → <EPStatusPill tone="warning">…</EPStatusPill>
 *
 *   And the soft-tint variant:
 *
 *     <Badge className="bg-green-100 text-green-800">…</Badge> → <EPStatusPill tone="success">…</EPStatusPill>
 *
 *   We don't touch Badges with `variant="outline"` since those usually carry
 *   informational meaning (categories, tags) rather than status.
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src/pages");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

const REPLACEMENTS = [
  // variant="default" (which renders primary/brand) — usually positive status
  [/<Badge\s+variant="default"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="success"$1>$2</EPStatusPill>'],
  // variant="secondary" — neutral
  [/<Badge\s+variant="secondary"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="neutral"$1>$2</EPStatusPill>'],
  // variant="destructive"
  [/<Badge\s+variant="destructive"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="danger"$1>$2</EPStatusPill>'],

  // className="bg-green-500 ..." — success
  [/<Badge\s+className="bg-green-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="success"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-emerald-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="success"$1>$2</EPStatusPill>'],
  // yellow/amber — warning
  [/<Badge\s+className="bg-yellow-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="warning"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-amber-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="warning"$1>$2</EPStatusPill>'],
  // red — danger
  [/<Badge\s+className="bg-red-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="danger"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-rose-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="danger"$1>$2</EPStatusPill>'],
  // blue — info
  [/<Badge\s+className="bg-blue-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="info"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-sky-(?:500|600|700)[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="info"$1>$2</EPStatusPill>'],

  // Soft-tint variants (e.g. bg-green-100 text-green-800)
  [/<Badge\s+className="bg-green-100\s+text-green-\d+[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="success"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-yellow-100\s+text-yellow-\d+[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="warning"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-red-100\s+text-red-\d+[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="danger"$1>$2</EPStatusPill>'],
  [/<Badge\s+className="bg-blue-100\s+text-blue-\d+[^"]*"([^>]*)>([^<]*?)<\/Badge>/g, '<EPStatusPill tone="info"$1>$2</EPStatusPill>'],
];

function ensureImport(src) {
  if (/import\s*\{[^}]*\bEPStatusPill\b[^}]*\}\s*from\s*["']@\/components\/ep["']/.test(src)) return src;
  const re = /(import\s*\{)([^}]*)(\}\s*from\s*["']@\/components\/ep["'])/;
  const m = re.exec(src);
  if (m) {
    const names = m[2].split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.includes("EPStatusPill")) names.push("EPStatusPill");
    return src.replace(re, `${m[1]} ${names.join(", ")} ${m[3].trimStart()}`);
  }
  // No existing import — add one after last import statement
  const importRe = /^[ \t]*import[^\n]*\n/gm;
  let lastEnd = 0;
  let mm;
  while ((mm = importRe.exec(src)) !== null) lastEnd = mm.index + mm[0].length;
  if (lastEnd === 0) return src;
  return src.slice(0, lastEnd) + `import { EPStatusPill } from "@/components/ep";\n` + src.slice(lastEnd);
}

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let changed = false;

  for (const [re, replacement] of REPLACEMENTS) {
    const before = src;
    src = src.replace(re, replacement);
    if (src !== before) changed = true;
  }

  if (changed) src = ensureImport(src);

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No status-badge patterns to migrate.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Migrated" : "📋 Would migrate"} ${fixed.length} file(s).`);
for (const f of fixed.slice(0, 10)) console.log(`  ${f}`);
if (fixed.length > 10) console.log(`  ... and ${fixed.length - 10} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
