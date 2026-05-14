#!/usr/bin/env node
/**
 * @module fix-status-colors
 * @description Replace raw Tailwind status-color classes with EuroPrint
 *   design-tokens. The design system mandates that semantic colours
 *   (success/warning/danger/info) come from `--ep-green`, `--ep-yellow`,
 *   `--ep-red`, `--ep-blue`, NOT from `text-green-600` etc.
 *
 *   We DON'T touch:
 *     - Status icon colours inside Lucide `<X className="text-green-500">`
 *       (those are decoration, not semantics) — actually we DO touch
 *       common pure-semantic uses; see rules below.
 *     - The public site (different palette).
 *     - The design system source CSS files.
 *
 *   Mappings:
 *
 *     text-green-{500..700}    → text-[var(--ep-green)]
 *     text-emerald-{500..700}  → text-[var(--ep-green)]
 *     text-red-{500..700}      → text-[var(--ep-red)]
 *     text-rose-{500..700}     → text-[var(--ep-red)]
 *     text-amber-{500..700}    → text-[var(--ep-yellow)]
 *     text-yellow-{500..700}   → text-[var(--ep-yellow)]
 *     text-blue-{500..700}     → text-[var(--ep-blue)]
 *     text-sky-{500..700}      → text-[var(--ep-blue)]
 *     text-purple-{500..700}   → text-[var(--ep-purple)]
 *     text-violet-{500..700}   → text-[var(--ep-purple)]
 *     text-cyan-{500..700}     → text-[var(--ep-cyan)]
 *     text-orange-{500..700}   → text-[var(--ep-primary)]
 *
 *     bg-X-500 (solid) → bg-[var(--ep-X)] when followed by text-white
 *     bg-X-100 + text-X-800 (soft pill) → ep-pill--X
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "europrint-site" ||
      entry === "node_modules" ||
      entry === "dist" ||
      entry === "erp-modern-ui"
    ) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

// Map { tailwind-color-prefix : ep-token-var }
const TEXT_MAP = {
  green: "--ep-green",
  emerald: "--ep-green",
  lime: "--ep-green",
  red: "--ep-red",
  rose: "--ep-red",
  amber: "--ep-yellow",
  yellow: "--ep-yellow",
  blue: "--ep-blue",
  sky: "--ep-blue",
  indigo: "--ep-blue",
  purple: "--ep-purple",
  violet: "--ep-purple",
  fuchsia: "--ep-purple",
  cyan: "--ep-cyan",
  teal: "--ep-cyan",
  orange: "--ep-primary",
};

const fixed = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let count = 0;

  // text-COLOR-NNN  → text-[var(--ep-NNN)]
  // Only mid-saturation shades (500..700) — light/dark variants left alone since
  // they're often intentional (text-green-200, text-red-900).
  for (const [color, token] of Object.entries(TEXT_MAP)) {
    const re = new RegExp(`(?<![\\w:-])text-${color}-(500|600|700)(?![\\w-])`, "g");
    src = src.replace(re, () => {
      count++;
      return `text-[var(${token})]`;
    });
  }

  // bg-COLOR-NNN (solid 500/600) → bg-[var(--ep-NNN)]
  // Only when paired with `text-white` (clearly a solid filled element).
  // Otherwise leaves it alone (might be soft tint).
  for (const [color, token] of Object.entries(TEXT_MAP)) {
    const re = new RegExp(`(?<![\\w:-])bg-${color}-(500|600|700)\\b([^"]*?)text-white`, "g");
    src = src.replace(re, (m, _shade, between) => {
      count++;
      return `bg-[var(${token})]${between}text-white`;
    });
  }

  // hover:bg-COLOR-NNN → hover:bg-[var(--ep-NNN)]/90  (slight darken on hover)
  for (const [color, token] of Object.entries(TEXT_MAP)) {
    const re = new RegExp(`(?<![\\w:-])hover:bg-${color}-(500|600|700)(?![\\w-])`, "g");
    src = src.replace(re, () => {
      count++;
      return `hover:bg-[var(${token})]/90`;
    });
  }

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count });
    totalReplacements += count;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No raw status colors found.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Replaced" : "📋 Would replace"} ${totalReplacements} class(es) in ${fixed.length} file(s):\n`);
for (const f of fixed.slice(0, 15)) console.log(`  ${f.count}× ${f.file}`);
if (fixed.length > 15) console.log(`  ... and ${fixed.length - 15} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
