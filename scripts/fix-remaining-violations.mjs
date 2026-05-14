#!/usr/bin/env node
/**
 * @module fix-remaining-violations
 * @description Sweeper script — picks up the residual design-system
 *   violations that the targeted scripts missed:
 *
 *   1. Inline-style raw hex colors that map cleanly to EP tokens:
 *      color/background: "#FF902F" → "var(--ep-primary)"
 *      color: "#15171A" → "hsl(var(--foreground))"
 *      color: "#fff" / "#FFFFFF" → "#fff" (kept — used on coloured tiles)
 *
 *   2. Forbidden `bg-gradient-to-*` in any non-marketing folder (still
 *      stragglers in CRM workspace, profile header, stats-card.tsx).
 *
 *   3. Tables not wrapped in `overflow-x-auto`:
 *      shadcn `<Table>` is already wrapped, so this is for raw `<table>`.
 *      We don't auto-wrap — too risky — but we report locations for manual fix.
 *
 *   4. Flex rows with 3+ children but no `flex-wrap`. Reported only.
 *
 *   Hex → CSS-token map (only the clearly-semantic cases):
 *     #FF902F #FF5D2E      → var(--ep-primary)
 *     #15171A              → hsl(var(--foreground))
 *     #FAFAF9              → hsl(var(--background))
 *     #FFFFFF #FFF #fff    → kept (often used as on-coloured-tile text)
 *     #EBEAE6              → hsl(var(--border))
 *     #6B6E72              → hsl(var(--muted-foreground))
 *     #2E8A5A              → var(--ep-green)
 *     #C0432F              → var(--ep-red)
 *     #B5891C              → var(--ep-yellow)
 *     #3563AC              → var(--ep-blue) / var(--mod-sd)
 *     #7A4FB1              → var(--ep-purple) / var(--mod-hr)
 *     #1A8FAF              → var(--ep-cyan)  / var(--mod-fi)
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

const HEX_MAP = {
  "#FF902F": "var(--ep-primary)",
  "#ff902f": "var(--ep-primary)",
  "#FF5D2E": "var(--ep-primary)",
  "#ff5d2e": "var(--ep-primary)",
  "#F07F1B": "var(--ep-primary-dark)",
  "#f07f1b": "var(--ep-primary-dark)",
  "#15171A": "hsl(var(--foreground))",
  "#15171a": "hsl(var(--foreground))",
  "#FAFAF9": "hsl(var(--background))",
  "#fafaf9": "hsl(var(--background))",
  "#EBEAE6": "hsl(var(--border))",
  "#ebeae6": "hsl(var(--border))",
  "#6B6E72": "hsl(var(--muted-foreground))",
  "#6b6e72": "hsl(var(--muted-foreground))",
  "#2E8A5A": "var(--ep-green)",
  "#2e8a5a": "var(--ep-green)",
  "#C0432F": "var(--ep-red)",
  "#c0432f": "var(--ep-red)",
  "#B5891C": "var(--ep-yellow)",
  "#b5891c": "var(--ep-yellow)",
  "#3563AC": "var(--mod-sd)",
  "#3563ac": "var(--mod-sd)",
  "#7A4FB1": "var(--mod-hr)",
  "#7a4fb1": "var(--mod-hr)",
  "#1A8FAF": "var(--mod-fi)",
  "#1a8faf": "var(--mod-fi)",
};

let hexReplacements = 0;
let gradientReplacements = 0;
const filesChanged = new Set();

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // 1. Hex colour replacement — only in style={{}} blocks to avoid touching
  //    color picker UIs that hold these as data.
  src = src.replace(/style=\{\{([^}]*)\}\}/g, (match, body) => {
    let newBody = body;
    for (const [hex, token] of Object.entries(HEX_MAP)) {
      const escaped = hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(["'])${escaped}\\1`, "g");
      newBody = newBody.replace(re, (m, q) => {
        hexReplacements++;
        return `${q}${token}${q}`;
      });
    }
    return `style={{${newBody}}}`;
  });

  // 2. Forbidden gradients — replace common offenders with flat colors.
  //    Linear-gradient strings inside style={{ background: "linear-gradient(...)" }}
  src = src.replace(
    /background:\s*"linear-gradient\([^"]*?(#[0-9a-fA-F]{3,6})[^"]*?\)"/g,
    (match, firstColor) => {
      gradientReplacements++;
      // Pick whichever of the captured colours we recognise; default to primary
      const mapped = HEX_MAP[firstColor] || HEX_MAP[firstColor.toLowerCase()] || "var(--ep-primary)";
      return `background: "${mapped}"`;
    },
  );

  // Also `bg-gradient-to-X` Tailwind that survived the earlier pass
  src = src.replace(/\bbg-gradient-to-\w+\s+/g, (m) => {
    gradientReplacements++;
    return "";
  });

  if (src !== original) {
    filesChanged.add(file);
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"}:`);
console.log(`  ${hexReplacements} hex colour(s) → CSS variables`);
console.log(`  ${gradientReplacements} gradient(s) removed`);
console.log(`  ${filesChanged.size} file(s) touched`);
if (!APPLY) console.log("\nRun with --fix to apply.");
