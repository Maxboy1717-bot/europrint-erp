#!/usr/bin/env node
/**
 * @module update-architecture-rules-doc
 * @description Runs the 22 reviewer scripts and rewrites the Summary table +
 * per-rule "Current Status" lines in ARCHITECTURE_RULES.md so the doc never
 * drifts from reality.
 *
 * Usage:
 *   node scripts/update-architecture-rules-doc.mjs
 *
 * CI usage (fail-on-drift):
 *   node scripts/update-architecture-rules-doc.mjs
 *   git diff --exit-code ARCHITECTURE_RULES.md
 *   # Non-zero exit → doc was stale; commit the regenerated version.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const DOC = resolve(ROOT, 'ARCHITECTURE_RULES.md');

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function runAggregator() {
  // Default per-script timeout pushed to 900s — git-bash on Windows can take
  // 3-5 minutes per reviewer when Defender / file-system caches are cold. The
  // 180s default in run-all-reviewers.sh produces sporadic spurious FAILs on
  // slow runs, so we override here. Caller can still raise it further via env.
  const env = { ...process.env, REVIEWER_TIMEOUT: process.env.REVIEWER_TIMEOUT ?? '900' };
  const cmd = 'bash scripts/run-all-reviewers.sh';
  try {
    return stripAnsi(execSync(cmd, { cwd: ROOT, env, encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 }));
  } catch (err) {
    // Aggregator exits 1 when any rule fails — that's expected, capture stdout
    return stripAnsi((err.stdout ?? '') + (err.stderr ?? ''));
  }
}

function parseSummary(output) {
  // Each summary line: "1    Result Pattern                         PASS     0"
  const rows = [];
  const re = /^\s*(\d{1,2})\s+(.+?)\s+(PASS|FAIL|SKIP)\s+(\d+)\s*$/gm;
  let m;
  while ((m = re.exec(output)) !== null) {
    const num = parseInt(m[1], 10);
    if (num < 1 || num > 22) continue;
    rows.push({ num, name: m[2].trim(), status: m[3], violations: parseInt(m[4], 10) });
  }
  if (rows.length !== 22) {
    throw new Error(`Expected 22 rule rows, got ${rows.length}. Aggregator output may be malformed.`);
  }
  return rows;
}

function renderSummaryTable(rows) {
  // Preserve the existing doc's Rule heading names (left side of `|`), only
  // refresh Status + Violations on each row.
  const orig = readFileSync(DOC, 'utf-8');
  const headingByNum = new Map();
  const ruleNameRe = /^\| (\d{1,2}) \| ([^|]+?) \|/gm;
  let m;
  while ((m = ruleNameRe.exec(orig)) !== null) {
    const num = parseInt(m[1], 10);
    if (!headingByNum.has(num)) headingByNum.set(num, m[2].trim());
  }
  const head = '| # | Rule | Status | Violations |\n|---|------|--------|------------|';
  const lines = rows.map(r => {
    const name = headingByNum.get(r.num) ?? r.name;
    const statusBadge = r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⚠️ SKIP';
    return `| ${r.num} | ${name} | ${statusBadge} | ${r.violations} |`;
  }).join('\n');
  const pass = rows.filter(r => r.status === 'PASS').length;
  const fail = rows.filter(r => r.status === 'FAIL').length;
  const aggregate = `\n**Aggregate: ${pass} PASS / ${fail} FAIL.** Run \`bash scripts/run-all-reviewers.sh\` for the live count.`;
  return `${head}\n${lines}\n${aggregate}`;
}

function replaceSummary(doc, newTable) {
  // Replace the block between "## Summary" and the next "---" separator.
  // Tolerates both LF and CRLF line endings.
  const summaryRe = /(## Summary\s*\r?\n)([\s\S]*?)(\r?\n---\r?\n)/;
  if (!summaryRe.test(doc)) {
    throw new Error('Could not locate "## Summary" section in ARCHITECTURE_RULES.md.');
  }
  const eol = doc.includes('\r\n') ? '\r\n' : '\n';
  const tableWithDocEol = newTable.replace(/\n/g, eol);
  return doc.replace(summaryRe, `$1${eol}${tableWithDocEol}${eol}$3`);
}

function updatePerRuleStatuses(doc, rows) {
  // Each rule section has a line like:
  //   **Current Status:** ✅ **PASS** — 0 violations
  // Replace each by matching "## Rule N —" anchor.
  let next = doc;
  for (const r of rows) {
    const anchorRe = new RegExp(`(## Rule ${r.num} —[^\\n]*\\n[\\s\\S]*?)(\\*\\*Current Status:\\*\\*[^\\n]*)`);
    if (!anchorRe.test(next)) continue;
    const badge = r.status === 'PASS' ? '✅ **PASS**' : r.status === 'FAIL' ? '❌ **FAIL**' : '⚠️ **SKIP**';
    const replacement = `**Current Status:** ${badge} — ${r.violations} violation${r.violations === 1 ? '' : 's'}`;
    next = next.replace(anchorRe, `$1${replacement}`);
  }
  return next;
}

// ── main ────────────────────────────────────────────────────────────────────
const output = runAggregator();
const rows = parseSummary(output);
const newTable = renderSummaryTable(rows);

const original = readFileSync(DOC, 'utf-8');
let updated = replaceSummary(original, newTable);
updated = updatePerRuleStatuses(updated, rows);

if (updated !== original) {
  writeFileSync(DOC, updated, 'utf-8');
  console.log(`ARCHITECTURE_RULES.md updated.`);
} else {
  console.log(`ARCHITECTURE_RULES.md already in sync.`);
}

const passCount = rows.filter(r => r.status === 'PASS').length;
const failCount = rows.filter(r => r.status === 'FAIL').length;
console.log(`Current: ${passCount} PASS / ${failCount} FAIL`);
process.exit(failCount > 0 ? 1 : 0);
