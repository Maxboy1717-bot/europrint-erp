#!/usr/bin/env node
/**
 * find-orphan-scripts.mjs — for every file in scripts/, check whether anything
 * outside scripts/ references it (by basename). Files that are NEVER referenced
 * are candidates for deletion.
 *
 * Output: orphan-scripts.txt (one path per line, safe to feed into `xargs rm`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const SCRIPTS_DIR = path.join(ROOT, 'scripts');

// Files NEVER to delete (entry points + chained from those entry points).
const KEEP = new Set([
  'full-audit.sh',        // referenced in package.json
  'page-audit.sh',        // referenced in package.json (root-level)
  'replit-deep-audit.sh', // referenced in package.json
  'run-all-reviewers.sh', // referenced in CLAUDE.md & docs
  // Chained from run-all-reviewers.sh
  'reviewer-result-pattern.sh',
  'reviewer-array-safety.sh',
  'reviewer-as-unknown.sh',
  'reviewer-dto-validation.sh',
  'reviewer-process-env.sh',
  'reviewer-jwt-guard.sh',
  'reviewer-wms-crud.sh',
  'reviewer-missing-endpoints.sh',
  'reviewer-slice-safety.sh',
  'reviewer-security.sh',
]);

function listScripts(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listScripts(full, rel));
    } else if (entry.isFile() && /\.(sh|mjs|js|cjs|ts)$/.test(entry.name)) {
      out.push({ rel, full, size: fs.statSync(full).size });
    }
  }
  return out;
}

const scripts = listScripts(SCRIPTS_DIR);
console.log(`Found ${scripts.length} script files in scripts/`);

// Aggregate all source text once: package.json files, .sh files (recursive chained calls), workflows, CLAUDE.md, docs
function loadHaystack() {
  const include = [
    'package.json',
    'apps/api/package.json',
    'artifacts/erp-dashboard/package.json',
    'lib/db/package.json',
  ];
  for (const e of fs.readdirSync('.github/workflows', { withFileTypes: true }).filter(d => d.isFile())) {
    include.push(`.github/workflows/${e.name}`);
  }
  // CLAUDE.md and docs
  for (const f of ['CLAUDE.md', 'README.md', 'DEPLOYMENT.md', 'MONITORING.md', 'SECURITY.md']) {
    if (fs.existsSync(f)) include.push(f);
  }
  // All shell scripts in scripts/ (so we catch script-A calling script-B)
  for (const s of scripts) include.push(`scripts/${s.rel}`);
  // contrib/ scripts
  if (fs.existsSync('contrib')) {
    function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.isFile() && /\.(sh|service|md|yml)$/.test(e.name)) include.push(full);
      }
    }
    walk('contrib');
  }
  // docs/
  if (fs.existsSync('docs')) {
    for (const e of fs.readdirSync('docs', { withFileTypes: true })) {
      if (e.isFile()) include.push(`docs/${e.name}`);
    }
  }
  let total = '';
  for (const f of include) {
    try { total += '\n' + fs.readFileSync(f, 'utf8'); } catch { /* skip */ }
  }
  return total;
}

const haystack = loadHaystack();
console.log(`Haystack size: ${(haystack.length / 1024).toFixed(1)} KB`);

const orphans = [];
const referenced = [];

for (const s of scripts) {
  const basename = path.basename(s.rel);

  if (KEEP.has(basename)) {
    referenced.push({ ...s, reason: 'KEEP-LIST' });
    continue;
  }

  // Look for basename mentions in haystack (excluding the file itself)
  // The haystack includes the file's own content; remove that first.
  const ownContent = fs.readFileSync(s.full, 'utf8');
  const cleaned = haystack.replace(ownContent, '');
  const re = new RegExp(`\\b${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);

  if (re.test(cleaned)) {
    referenced.push({ ...s, reason: 'REFERENCED' });
  } else {
    orphans.push(s);
  }
}

console.log(`\nReferenced: ${referenced.length}`);
console.log(`Orphan:     ${orphans.length}`);
console.log(`Total size of orphans: ${(orphans.reduce((a, b) => a + b.size, 0) / 1024).toFixed(1)} KB`);

// Save list
fs.writeFileSync('orphan-scripts.txt', orphans.map(s => `scripts/${s.rel}`).join('\n') + '\n');
console.log(`\nSaved to orphan-scripts.txt (${orphans.length} files)`);

// Show top 30 by size
const sorted = orphans.sort((a, b) => b.size - a.size).slice(0, 30);
console.log('\nTop 30 orphans by size:');
for (const o of sorted) {
  console.log(`  ${(o.size / 1024).toFixed(1).padStart(7)} KB  scripts/${o.rel}`);
}
