#!/usr/bin/env node
/**
 * @module fix-multiline-pageheader
 * @description Repairs the 8 pages where the migration script's lazy regex
 *   failed to convert `<PageHeader ...>` blocks because the JSX has
 *   `actions={<>...</>}` with embedded `>` characters that confused
 *   `[^>]*?`. This pass uses a proper balanced-brace parser to extract
 *   the attribute block, then rewrites to <EPPageHeader>.
 *
 *   Also drops the unused `PageHeader` import.
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

/**
 * Find the position of the matching closing `>` for an opening tag
 * starting at `start` in `src`. Handles embedded `{...}` (including
 * nested JSX `<Foo />`).
 *
 * Returns the index of the `>` that closes the tag, or -1 if not found.
 * If the tag is self-closing (ends with `/>`), returns the index of `/`.
 */
function findTagClose(src, start) {
  let depth = 0; // brace depth (inside {...})
  let i = start;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return i;
    i++;
  }
  return -1;
}

/** Find the matching </PageHeader> for an opening at `openEnd`. */
function findClosingTag(src, openEnd) {
  return src.indexOf("</PageHeader>", openEnd);
}

function extractAttr(attrs, name) {
  // Build a regex that captures either a string-literal value or a
  // brace-delimited expression. We do this manually because regex alone
  // can't balance nested braces.
  const re = new RegExp(`\\b${name}=`);
  const m = re.exec(attrs);
  if (!m) return null;
  const startVal = m.index + m[0].length;
  const first = attrs[startVal];
  if (first === '"' || first === "'") {
    const end = attrs.indexOf(first, startVal + 1);
    if (end === -1) return null;
    return {
      fullText: attrs.slice(m.index, end + 1),
      value: attrs.slice(startVal + 1, end),
      isExpression: false,
    };
  }
  if (first === "{") {
    let depth = 1;
    let i = startVal + 1;
    while (i < attrs.length && depth > 0) {
      if (attrs[i] === "{") depth++;
      else if (attrs[i] === "}") depth--;
      i++;
    }
    return {
      fullText: attrs.slice(m.index, i),
      value: attrs.slice(startVal + 1, i - 1),
      isExpression: true,
    };
  }
  return null;
}

function removeAttr(attrs, name) {
  const a = extractAttr(attrs, name);
  if (!a) return attrs;
  return attrs.replace(a.fullText, "").replace(/\s+/g, " ").trim();
}

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // Remove leftover `import { PageHeader }` line
  src = src.replace(
    /import\s*\{\s*PageHeader\s*\}\s*from\s*["']@\/components\/ui\/page-header["']\s*;?\s*\n/,
    "",
  );

  // Iteratively rewrite each <PageHeader ...> occurrence
  while (true) {
    const idx = src.indexOf("<PageHeader");
    if (idx === -1) break;
    const close = findTagClose(src, idx + "<PageHeader".length);
    if (close === -1) break;

    const selfClose = src[close - 1] === "/";
    const attrsStart = idx + "<PageHeader".length;
    const attrsEnd = selfClose ? close - 1 : close;
    let attrs = src.slice(attrsStart, attrsEnd).trim();

    const titleA = extractAttr(attrs, "title");
    const boldA = extractAttr(attrs, "boldWord");
    const subtitleA = extractAttr(attrs, "subtitle") || extractAttr(attrs, "description");
    const actionsA = extractAttr(attrs, "actions");

    let title = titleA?.value || "Sahifa";
    if (boldA) title = `${title} ${boldA.value}`.trim();

    // Strip known attrs from the rest (keep data-testid, etc.)
    attrs = removeAttr(attrs, "title");
    attrs = removeAttr(attrs, "boldWord");
    attrs = removeAttr(attrs, "subtitle");
    attrs = removeAttr(attrs, "description");
    attrs = removeAttr(attrs, "icon");
    attrs = removeAttr(attrs, "label");
    attrs = removeAttr(attrs, "actions");

    const isTitleExpr = titleA?.isExpression;
    const titleLine = isTitleExpr
      ? `title={${titleA.value}}`
      : `title="${(title || "").replace(/"/g, "&quot;")}"`;
    const breadcrumbLine = isTitleExpr
      ? `breadcrumb={<>Dashboard · <b className="text-foreground">{${titleA.value}}</b></>}`
      : `breadcrumb={<>Dashboard · <b className="text-foreground">${title}</b></>}`;
    const subtitleLine = subtitleA
      ? subtitleA.isExpression
        ? `subtitle={${subtitleA.value}}`
        : `subtitle="${subtitleA.value.replace(/"/g, "&quot;")}"`
      : "";
    const actionsLine = actionsA ? `actions={${actionsA.value}}` : "";

    const lines = [breadcrumbLine, titleLine];
    if (subtitleLine) lines.push(subtitleLine);
    if (actionsLine) lines.push(actionsLine);
    if (attrs) lines.push(attrs);

    const body = lines.filter(Boolean).join("\n        ");
    const newOpen = selfClose
      ? `<EPPageHeader\n        ${body}\n      />`
      : `<EPPageHeader\n        ${body}\n      >`;

    // Replace
    const end = selfClose ? close + 1 : close + 1;
    src = src.slice(0, idx) + newOpen + src.slice(end);

    if (!selfClose) {
      // Replace closing </PageHeader> next
      const closeTag = findClosingTag(src, idx);
      if (closeTag !== -1) {
        src = src.slice(0, closeTag) + "</EPPageHeader>" + src.slice(closeTag + "</PageHeader>".length);
      }
    }
  }

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No multi-line PageHeader to fix.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s):\n`);
for (const f of fixed) console.log(`  ${f}`);
if (!APPLY) console.log("\nRun with --fix to apply.");
