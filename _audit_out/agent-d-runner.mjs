#!/usr/bin/env node
// T2 Agent D — components tsx batch runner.
//
//   - Iterates every .tsx under artifacts/erp-dashboard/src/components/
//   - Skips sidebar constants, ui primitives, test/spec/stories
//   - Calls tsx-hardcoded-extractor.mjs --apply for each.
//   - Every BATCH_SIZE successful writes -> runs pnpm typecheck.
//   - On typecheck failure -> reverts the last batch.
//   - Writes stats + reverted list to _audit_out/agent-d-report.json
//
//   Usage: node _audit_out/agent-d-runner.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const COMPONENTS = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'components');
const EXTRACTOR  = path.resolve(ROOT, '_audit_out', 'tsx-hardcoded-extractor.mjs');
const REPORT     = path.resolve(ROOT, '_audit_out', 'agent-d-report.json');
const BATCH_SIZE = 20;

// ── Skip rules ──
const SKIP_PATTERNS = [
  /[\\/]sidebar[\\/]constants(-|\.)/i,        // sidebar/constants*.ts (NOT tsx but keep guard)
  /[\\/]sidebar[\\/]constants-groups-/i,
  /[\\/]sidebar[\\/]constants-hidden/i,
  /\.test\./i,
  /\.spec\./i,
  /\.stories\./i,
  /[\\/]__tests__[\\/]/i,
  /[\\/]__mocks__[\\/]/i,
];

function shouldSkip(file) {
  return SKIP_PATTERNS.some(re => re.test(file));
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, out);
    } else if (ent.name.endsWith('.tsx') && !shouldSkip(p)) {
      out.push(p);
    }
  }
  return out;
}

let BASELINE_SIGS = null;

function errSig(e) {
  const m = e.match(/^(.+?\.tsx?)\((\d+),(\d+)\):\s*(error TS\d+):/);
  return m ? `${m[1]}:${m[4]}` : e;
}

function getTscErrors() {
  const r = spawnSync('pnpm', ['--filter', 'erp-dashboard', 'run', 'typecheck'], {
    cwd: ROOT, encoding: 'utf8', shell: true, maxBuffer: 50 * 1024 * 1024,
  });
  const out = (r.stdout || '') + '\n' + (r.stderr || '');
  return out.split('\n').filter(l => /error TS/.test(l));
}

function captureBaseline() {
  const errs = getTscErrors();
  BASELINE_SIGS = new Set(errs.map(errSig));
  console.log(`Baseline TSC errors: ${errs.length}`);
  for (const e of errs.slice(0, 5)) console.log(`  baseline: ${e}`);
}

function runTypecheck() {
  const errs = getTscErrors();
  const newErrs = errs.filter(e => !BASELINE_SIGS.has(errSig(e)));
  return {
    ok: newErrs.length === 0,
    errorCount: newErrs.length,
    sample: newErrs.slice(0, 5).join('\n'),
  };
}

// Helper: snapshot file content before processing
const snapshots = new Map();
function snapshot(file) {
  if (!snapshots.has(file)) snapshots.set(file, fs.readFileSync(file, 'utf8'));
}
function revert(file) {
  if (snapshots.has(file)) {
    fs.writeFileSync(file, snapshots.get(file), 'utf8');
    snapshots.delete(file);
  }
}
function forget(file) { snapshots.delete(file); }

// Also snapshot locale files so we can revert keys
const UZ_JSON = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales', 'uz', 'common.json');
const RU_JSON = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales', 'ru', 'common.json');
let uzSnap = fs.existsSync(UZ_JSON) ? fs.readFileSync(UZ_JSON, 'utf8') : null;
let ruSnap = fs.existsSync(RU_JSON) ? fs.readFileSync(RU_JSON, 'utf8') : null;

function snapshotLocales() {
  uzSnap = fs.existsSync(UZ_JSON) ? fs.readFileSync(UZ_JSON, 'utf8') : null;
  ruSnap = fs.existsSync(RU_JSON) ? fs.readFileSync(RU_JSON, 'utf8') : null;
}
function revertLocales() {
  if (uzSnap !== null) fs.writeFileSync(UZ_JSON, uzSnap, 'utf8');
  if (ruSnap !== null) fs.writeFileSync(RU_JSON, ruSnap, 'utf8');
}

// ── Main ──
captureBaseline();
const files = walk(COMPONENTS);
console.log(`Total candidate files: ${files.length}`);

const stats = {
  totalCandidates: files.length,
  processed: 0,
  changed: 0,
  noChange: 0,
  errors: 0,
  reverted: [],
  byComponent: {}, // file -> replacement count
  typecheckRuns: 0,
  typecheckFails: 0,
  startedAt: new Date().toISOString(),
};

let batch = [];

function flushBatch() {
  if (batch.length === 0) return;
  stats.typecheckRuns++;
  const tc = runTypecheck();
  console.log(`  [batch] typecheck: ${tc.ok ? 'OK' : 'FAIL'} (errCount=${tc.errorCount})`);
  if (!tc.ok) {
    stats.typecheckFails++;
    // Revert all files in this batch + locales
    console.log(`  [batch] FAIL → reverting ${batch.length} files`);
    for (const f of batch) {
      revert(f);
      stats.reverted.push(path.relative(ROOT, f).replace(/\\/g, '/'));
    }
    revertLocales();
    // Re-run typecheck to confirm baseline restored
    const tc2 = runTypecheck();
    if (!tc2.ok) {
      console.log(`  [batch] WARNING: typecheck still failing after revert (sample): ${tc2.sample}`);
    }
  } else {
    // Forget snapshots — commit the changes
    for (const f of batch) forget(f);
    // Refresh locale snapshot for next batch
    snapshotLocales();
  }
  batch = [];
}

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  snapshot(file);
  let r;
  try {
    r = execSync(`node "${EXTRACTOR}" --apply "${file}"`, { encoding: 'utf8' });
  } catch (e) {
    stats.errors++;
    forget(file);
    console.log(`  ERR  ${path.relative(ROOT, file)}`);
    continue;
  }
  stats.processed++;
  const m = r.match(/WROTE\s+\S+\s+\+(\d+)/);
  if (m) {
    stats.changed++;
    const reps = parseInt(m[1], 10);
    stats.byComponent[path.relative(ROOT, file).replace(/\\/g, '/')] = reps;
    batch.push(file);
  } else {
    stats.noChange++;
    forget(file);
  }
  if (batch.length >= BATCH_SIZE) flushBatch();
  if (stats.processed % 50 === 0) {
    console.log(`  [progress] ${stats.processed}/${files.length}  changed=${stats.changed}  reverted=${stats.reverted.length}`);
  }
}

// Final flush
flushBatch();

stats.finishedAt = new Date().toISOString();
fs.writeFileSync(REPORT, JSON.stringify(stats, null, 2), 'utf8');

console.log('');
console.log('═════════════ AGENT D — FINAL ═════════════');
console.log(`Processed         : ${stats.processed}`);
console.log(`Changed           : ${stats.changed}`);
console.log(`No-change         : ${stats.noChange}`);
console.log(`Errors            : ${stats.errors}`);
console.log(`Typecheck runs    : ${stats.typecheckRuns}`);
console.log(`Typecheck FAILs   : ${stats.typecheckFails}`);
console.log(`Reverted files    : ${stats.reverted.length}`);

const top = Object.entries(stats.byComponent).sort((a,b) => b[1]-a[1]).slice(0, 5);
console.log('Top 5 components by replacement count:');
for (const [f, n] of top) console.log(`  ${n.toString().padStart(4)}  ${f}`);

console.log(`Report written to: ${path.relative(ROOT, REPORT)}`);
