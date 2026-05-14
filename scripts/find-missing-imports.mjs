#!/usr/bin/env node
/**
 * @module find-missing-imports
 * @description Scans the erp-dashboard src tree for symbols that are USED in code
 *   but NOT imported. Targets the most common offenders we've seen after large
 *   refactors / file splits:
 *
 *     - apiRequest, queryClient, safeArray  (from @/lib/queryClient)
 *     - useToast                            (from @/hooks/use-toast)
 *     - useTranslation                      (from @/lib/i18n)
 *     - formatCurrency, formatDate          (from @/lib/format)
 *     - cn                                  (from @/lib/utils)
 *
 * For each known symbol, the script can also AUTOFIX by inserting the standard
 * import. Run with `--fix` to apply.
 *
 *   node scripts/find-missing-imports.mjs           # report only
 *   node scripts/find-missing-imports.mjs --fix     # also fix
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(
  process.argv[2] ??
    "artifacts/erp-dashboard/src",
);

const APPLY_FIX = process.argv.includes("--fix");

// Each rule:
//   symbol           — the imported name we look for in code
//   from             — module path it should be imported from
//   importStyle      — 'named' (default) or 'default'
//   contextRegex     — optional: only flag if this regex also matches in the file
//                      (so we don't false-positive on a CSS class named "cn"
//                       or a local variable shadowing the symbol)
// Use negative-lookbehind `(?<![.\w])` to skip member access like `m.apiRequest`
// or `someObj.formatCurrency` — those access the symbol from another object,
// not as a free variable that would need to be imported.
const RULES = [
  { symbol: "apiRequest",      from: "@/lib/queryClient", contextRegex: /(?<![.\w])apiRequest\s*\(/ },
  { symbol: "queryClient",     from: "@/lib/queryClient", contextRegex: /(?<![.\w])queryClient\.(invalidateQueries|setQueryData|getQueryData|removeQueries|refetchQueries)/ },
  { symbol: "safeArray",       from: "@/lib/queryClient", contextRegex: /(?<![.\w])safeArray\s*\(/ },
  { symbol: "useToast",        from: "@/hooks/use-toast", contextRegex: /(?<![.\w])useToast\s*\(\s*\)/ },
  { symbol: "useTranslation",  from: "@/lib/i18n",        contextRegex: /(?<![.\w])useTranslation\s*\(/ },
  { symbol: "formatCurrency",  from: "@/lib/format",      contextRegex: /(?<![.\w])formatCurrency\s*\(/ },
  { symbol: "formatDate",      from: "@/lib/format",      contextRegex: /(?<![.\w])formatDate\s*\(/ },
  { symbol: "cn",              from: "@/lib/utils",       contextRegex: /(?<![.\w])cn\s*\(/ },
];

/**
 * Returns true if `symbol` is destructured from a function param or local
 * `const { symbol } = ...` — meaning the file gets it from a prop or another
 * source, not from a top-level import.
 */
function isDestructuredLocally(source, symbol) {
  const escSym = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // function fn({ a, symbol, b })   |   ({ a, symbol }: Props) =>   |
  // const { a, symbol } = ...       |   const [a, symbol] = ...
  const re = new RegExp(
    `(?:\\bfunction\\s+\\w+\\s*\\(|=>\\s*|\\(|=\\s*)\\{[^}]*\\b${escSym}\\b[^}]*\\}`,
  );
  if (re.test(source)) return true;
  const constRe = new RegExp(
    `\\b(?:const|let|var)\\s*\\{[^}]*\\b${escSym}\\b[^}]*\\}\\s*=`,
  );
  return constRe.test(source);
}

/** @returns {string[]} list of absolute paths */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".next") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(p);
  }
  return out;
}

/**
 * Returns true if the file DEFINES the symbol itself (e.g. lib/format.ts
 * defines formatDate). Library source files don't import their own exports.
 */
function isOwnDefinition(source, symbol) {
  const escSym = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${escSym}\\b`),
    new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${escSym}\\b`),
    new RegExp(`\\bexport\\s+(?:type|interface|class)\\s+${escSym}\\b`),
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${escSym}\\b[^}]*\\}`),
    // local declaration (e.g. tests that define their own mock useTranslation)
    new RegExp(`^[ \\t]*(?:const|let|var|function)\\s+${escSym}\\b`, "m"),
  ];
  return patterns.some((re) => re.test(source));
}

/**
 * Returns true if `source` imports `symbol` from ANY module path.
 * (Even if it's a relative path like `../i18n/hooks` rather than the
 *  canonical `@/lib/i18n` — we shouldn't double-import.)
 * Handles multi-line import blocks.
 */
function isAlreadyImported(source, symbol /* fromPath unused — we accept any source */) {
  const escSym = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Any named-import block that contains the symbol (multi-line aware via [\s\S])
  const re = new RegExp(
    `import\\s*(?:[\\w*]+\\s*,\\s*)?\\{[\\s\\S]*?\\b${escSym}\\b[\\s\\S]*?\\}\\s*from\\s*["'][^"']+["']`,
  );
  return re.test(source);
}

/**
 * Insert `symbol` into an existing named-import group from `fromPath`,
 * or add a fresh import line after the last existing import.
 * Returns the new source string, or null if it can't safely modify.
 */
function injectImport(source, symbol, fromPath) {
  const escFrom = fromPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Case 1: existing named-import line from the same module — splice in.
  const existingRe = new RegExp(
    `(import\\s*\\{)([^}]*)(\\}\\s*from\\s*["']${escFrom}["'])`,
    "m",
  );
  const m = existingRe.exec(source);
  if (m) {
    const names = m[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.includes(symbol)) return source; // already there
    names.push(symbol);
    const newBlock = `${m[1]} ${names.join(", ")} ${m[3].trimStart()}`;
    return source.replace(existingRe, newBlock);
  }

  // Case 2: no existing import line from that module — add after last import.
  const lastImportRe = /^[ \t]*import[^\n]*\n(?![ \t]*import)/gm;
  let lastIdx = -1;
  for (const match of source.matchAll(/^[ \t]*import[^\n]*\n/gm)) {
    lastIdx = (match.index ?? 0) + match[0].length;
  }
  const importLine = `import { ${symbol} } from "${fromPath}";\n`;
  if (lastIdx === -1) {
    // No imports at all — put it at the top, after any leading comment/docblock.
    const docBlockEnd = source.match(/^\/\*\*[\s\S]*?\*\/\s*\n/);
    const insertAt = docBlockEnd ? docBlockEnd[0].length : 0;
    return source.slice(0, insertAt) + importLine + source.slice(insertAt);
  }
  return source.slice(0, lastIdx) + importLine + source.slice(lastIdx);
}

/** Strip line/block comments and string/template literals so we don't match inside them. */
function stripNonCode(src) {
  // remove line comments
  let s = src.replace(/\/\/[^\n]*/g, "");
  // remove block comments (non-greedy)
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  // remove single/double-quoted strings (no multiline)
  s = s.replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  // remove template literals (simple — drops contents, keeps backticks)
  s = s.replace(/`(?:[^`\\]|\\[\s\S])*`/g, "``");
  return s;
}

const findings = [];
let fixedFiles = 0;

for (const file of walk(ROOT)) {
  const orig = readFileSync(file, "utf8");
  const code = stripNonCode(orig);
  let working = orig;
  let didFix = false;

  for (const rule of RULES) {
    if (!rule.contextRegex.test(code)) continue; // symbol not used as free var
    if (isAlreadyImported(working, rule.symbol, rule.from)) continue; // already imported
    if (isOwnDefinition(orig, rule.symbol)) continue; // file defines the symbol itself
    if (isDestructuredLocally(orig, rule.symbol)) continue; // received as prop/local destructure

    // Find the first line number of any usage in the stripped code
    const lines = code.split("\n");
    const lineIdx = lines.findIndex((ln) => rule.contextRegex.test(ln));
    const lineNo = lineIdx >= 0 ? lineIdx + 1 : 0;

    findings.push({
      file: relative(process.cwd(), file),
      line: lineNo,
      symbol: rule.symbol,
      from: rule.from,
    });

    if (APPLY_FIX) {
      const after = injectImport(working, rule.symbol, rule.from);
      if (after && after !== working) {
        working = after;
        didFix = true;
      }
    }
  }

  if (APPLY_FIX && didFix) {
    writeFileSync(file, working, "utf8");
    fixedFiles++;
  }
}

if (findings.length === 0) {
  console.log("✅ No missing-import issues found.");
  process.exit(0);
}

// Report grouped by symbol
const bySymbol = new Map();
for (const f of findings) {
  if (!bySymbol.has(f.symbol)) bySymbol.set(f.symbol, []);
  bySymbol.get(f.symbol).push(f);
}

console.log(`\nFound ${findings.length} missing-import issue(s) in ${new Set(findings.map((f) => f.file)).size} file(s):\n`);
for (const [symbol, list] of bySymbol) {
  console.log(`  ${symbol}  (from ${list[0].from}) — ${list.length} file(s)`);
  for (const f of list) {
    console.log(`    ${f.file}:${f.line}`);
  }
}

if (APPLY_FIX) {
  console.log(`\n✅ Auto-fixed ${fixedFiles} file(s).`);
} else {
  console.log(`\nRun with --fix to apply imports automatically.`);
}
