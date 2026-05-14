#!/usr/bin/env node
/**
 * @module migrate-pages-to-ep
 * @description Automated migration script that converts every page in
 *   `artifacts/erp-dashboard/src/pages/` over to the EuroPrint design
 *   system. Applies four mechanical replacements per file:
 *
 *   1. `import { PageHeader } from "@/components/ui/page-header";`
 *      → drop the old import line (EPPageHeader replaces it)
 *
 *   2. `import { ErrorState } from "@/components/ui/error-state";`
 *      → drop the old import line (EPErrorState replaces it)
 *
 *   3. If either replacement happened, INJECT
 *      `import { EPPageHeader, EPErrorState } from "@/components/ep";`
 *      after the last existing import (idempotent — skip if already there).
 *
 *   4. Replace JSX usage:
 *
 *      `<PageHeader title="X" boldWord="Y" subtitle="Z" ...rest />`
 *        →
 *      `<EPPageHeader
 *         breadcrumb={<>Dashboard · <b className="text-foreground">X Y</b></>}
 *         title="X Y"
 *         subtitle="Z"
 *         ...rest />`
 *
 *      `<ErrorState onRetry={refetch} />`
 *        →
 *      `<EPErrorState onRetry={refetch} />`
 *
 * Run from the workspace root:
 *
 *   node scripts/migrate-pages-to-ep.mjs            # report what would change
 *   node scripts/migrate-pages-to-ep.mjs --fix      # actually rewrite files
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

/** Inject `injectLine` after the last import statement. Idempotent. */
function injectImportAfterLast(src, injectLine) {
  if (src.includes(injectLine)) return { src, changed: false };
  // Find the end of the import block
  const importRe = /^[ \t]*import[^\n]*\n/gm;
  let lastEnd = 0;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd === 0) return { src, changed: false };
  return { src: src.slice(0, lastEnd) + injectLine + "\n" + src.slice(lastEnd), changed: true };
}

/** True if the file already imports `name` from `@/components/ep`. */
function hasEpImport(src, name) {
  return new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["']@/components/ep["']`).test(src);
}

/** Append `name` to an existing `from "@/components/ep"` import. */
function appendToEpImport(src, name) {
  if (hasEpImport(src, name)) return { src, changed: false };
  const re = /(import\s*\{)([^}]*)(\}\s*from\s*["']@\/components\/ep["'])/;
  const m = re.exec(src);
  if (!m) return { src, changed: false };
  const names = m[2].split(",").map((s) => s.trim()).filter(Boolean);
  names.push(name);
  const newBlock = `${m[1]} ${names.join(", ")} ${m[3].trimStart()}`;
  return { src: src.replace(re, newBlock), changed: true };
}

const results = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  const changes = [];

  // ── 1. PageHeader → EPPageHeader ────────────────────────────────────────
  const hasPageHeaderImport = /import\s*\{\s*PageHeader\s*\}\s*from\s*["']@\/components\/ui\/page-header["']\s*;?\s*\n/.test(src);
  const usesPageHeader = /<PageHeader\b/.test(src);

  if (hasPageHeaderImport) {
    src = src.replace(/import\s*\{\s*PageHeader\s*\}\s*from\s*["']@\/components\/ui\/page-header["']\s*;?\s*\n/, "");
    changes.push("removed `import { PageHeader }`");
  }

  if (usesPageHeader) {
    // Convert <PageHeader title="X" boldWord="Y" subtitle="Z" attrA={a} attrB={b}>
    // into <EPPageHeader breadcrumb={<>Dashboard · <b>X Y</b></>} title="X Y" subtitle="Z" attrA={a} attrB={b}>
    src = src.replace(
      /<PageHeader([^>]*?)\/>/g,
      (full, attrs) => buildEpPageHeader(attrs, true),
    );
    src = src.replace(
      /<PageHeader([^>]*?)>([\s\S]*?)<\/PageHeader>/g,
      (full, attrs, children) => buildEpPageHeader(attrs, false, children),
    );
    changes.push("rewrote <PageHeader>");
  }

  // ── 2. ErrorState → EPErrorState ────────────────────────────────────────
  const hasErrorStateImport = /import\s*\{\s*ErrorState\s*\}\s*from\s*["']@\/components\/ui\/error-state["']\s*;?\s*\n/.test(src);
  const usesErrorState = /<ErrorState\b/.test(src);

  if (hasErrorStateImport) {
    src = src.replace(/import\s*\{\s*ErrorState\s*\}\s*from\s*["']@\/components\/ui\/error-state["']\s*;?\s*\n/, "");
    changes.push("removed `import { ErrorState }`");
  }

  if (usesErrorState) {
    src = src.replace(/<ErrorState\b/g, "<EPErrorState");
    src = src.replace(/<\/ErrorState>/g, "</EPErrorState>");
    changes.push("rewrote <ErrorState>");
  }

  // ── 3. Inject `@/components/ep` imports if needed ───────────────────────
  const needsPageHeader = usesPageHeader;
  const needsErrorState = usesErrorState;

  if (needsPageHeader || needsErrorState) {
    const existing = /import\s*\{[^}]*\}\s*from\s*["']@\/components\/ep["']/.test(src);
    if (existing) {
      if (needsPageHeader) {
        const r = appendToEpImport(src, "EPPageHeader");
        src = r.src;
      }
      if (needsErrorState) {
        const r = appendToEpImport(src, "EPErrorState");
        src = r.src;
      }
    } else {
      const names = [];
      if (needsPageHeader) names.push("EPPageHeader");
      if (needsErrorState) names.push("EPErrorState");
      const line = `import { ${names.join(", ")} } from "@/components/ep";`;
      const r = injectImportAfterLast(src, line);
      src = r.src;
    }
    changes.push("added EP imports");
  }

  if (src !== original) {
    results.push({ file: relative(process.cwd(), file), changes });
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function getAttr(attrs, name) {
  // matches title="..." OR title={...} OR title='...'
  const re1 = new RegExp(`\\b${name}=("([^"]*)"|'([^']*)'|\\{([^}]*)\\})`);
  const m = re1.exec(attrs);
  if (!m) return null;
  return { full: m[0], value: m[2] ?? m[3] ?? m[4] ?? "", isExpression: m[4] !== undefined };
}

function removeAttr(attrs, name) {
  return attrs.replace(new RegExp(`\\s*\\b${name}=("[^"]*"|'[^']*'|\\{[^}]*\\})`), "");
}

function buildEpPageHeader(attrs, selfClose, children) {
  const titleAttr = getAttr(attrs, "title");
  const boldWordAttr = getAttr(attrs, "boldWord");
  const subtitleAttr = getAttr(attrs, "subtitle") || getAttr(attrs, "description");

  let title = titleAttr?.value || "Sahifa";
  if (boldWordAttr) title = `${title} ${boldWordAttr.value}`.trim();

  let rest = attrs;
  rest = removeAttr(rest, "title");
  rest = removeAttr(rest, "boldWord");
  rest = removeAttr(rest, "subtitle");
  rest = removeAttr(rest, "description");
  // drop icon (we use breadcrumb instead)
  rest = removeAttr(rest, "icon");
  rest = removeAttr(rest, "label");
  rest = rest.trim();

  const breadcrumb = `breadcrumb={<>Dashboard · <b className="text-foreground">${escapeForJsx(title)}</b></>}`;
  const titleLine = `title="${escapeAttr(title)}"`;
  const subtitleLine = subtitleAttr
    ? subtitleAttr.isExpression
      ? `subtitle={${subtitleAttr.value}}`
      : `subtitle="${escapeAttr(subtitleAttr.value)}"`
    : "";

  const lines = [breadcrumb, titleLine];
  if (subtitleLine) lines.push(subtitleLine);
  if (rest) lines.push(rest);

  const body = lines.filter(Boolean).join("\n        ");
  if (selfClose) {
    return `<EPPageHeader\n        ${body}\n      />`;
  }
  return `<EPPageHeader\n        ${body}\n      >${children}</EPPageHeader>`;
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '\\"');
}

function escapeForJsx(s) {
  return String(s).replace(/{/g, "&#123;").replace(/}/g, "&#125;");
}

// ─── Report ──────────────────────────────────────────────────────────────

if (results.length === 0) {
  console.log("✅ Nothing to migrate.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Rewrote" : "📋 Would rewrite"} ${results.length} file(s):\n`);
for (const { file, changes } of results) {
  console.log(`  ${file}`);
  for (const c of changes) console.log(`    · ${c}`);
}
if (!APPLY) console.log("\nRun with --fix to apply.");
