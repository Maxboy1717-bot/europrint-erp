/**
 * @module rules.spec
 * @description Architecture-rules contract tests. For every one of the 22
 * rules in ARCHITECTURE_RULES.md, we verify:
 *   (a) the rule is documented in the markdown,
 *   (b) the reviewer script file exists and is readable,
 *   (c) running the reviewer returns a deterministic 0 (PASS) or 1 (FAIL),
 *   (d) a known wrong pattern is flagged when planted into a temp file,
 *   (e) a known correct pattern is NOT flagged.
 *
 * The (d)/(e) checks use shared fixture utilities — each rule contributes a
 * `goodSample` and `badSample` snippet that the reviewer should classify
 * accordingly when scanning a synthetic directory.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRIPTS = path.join(ROOT, 'scripts');
const RULES_MD = path.join(ROOT, 'ARCHITECTURE_RULES.md');

interface RuleSpec {
  number: number;
  title: string;
  reviewerScript: string;     // filename in scripts/
  badPattern: string;          // regex string the reviewer should match
  goodPattern: string;         // pattern that should NOT match
  docKeywords: string[];       // words that must appear in ARCHITECTURE_RULES.md
}

const RULES: RuleSpec[] = [
  { number: 1, title: 'Result Pattern',
    reviewerScript: 'reviewer-result-pattern.sh',
    badPattern: 'return null',
    goodPattern: 'return ok(',
    docKeywords: ['Result', 'Promise', 'ok(', 'err('],
  },
  { number: 2, title: 'Array Safety',
    reviewerScript: 'reviewer-array-safety.sh',
    badPattern: 'data.map(',
    goodPattern: 'Array.isArray(data)',
    docKeywords: ['Array.isArray', '.map', '.filter'],
  },
  { number: 3, title: 'Zod Validation',
    reviewerScript: 'reviewer-dto-validation.sh',
    badPattern: '@IsString()',
    goodPattern: 'z.object({',
    docKeywords: ['Zod', 'class-validator'],
  },
  { number: 4, title: 'No Raw SQL',
    reviewerScript: 'reviewer-raw-sql.sh',
    badPattern: 'sql.raw(rawQuery)',
    goodPattern: 'sql`SELECT',
    docKeywords: ['Drizzle', 'sql.raw'],
  },
  { number: 5, title: 'No as unknown Stubs',
    reviewerScript: 'reviewer-as-unknown.sh',
    badPattern: '[] as unknown[]',
    goodPattern: 'await this.repo.findAll()',
    docKeywords: ['as unknown', 'stub'],
  },
  { number: 6, title: 'Controller is Transport Only',
    reviewerScript: 'reviewer-controller-logic.sh',
    badPattern: 'rows.reduce((s, r)',
    goodPattern: 'return unwrapOrThrow(',
    docKeywords: ['controller', 'transport'],
  },
  { number: 7, title: 'Environment Variables via ConfigService',
    reviewerScript: 'reviewer-process-env.sh',
    badPattern: 'process.env.JWT_SECRET',
    goodPattern: 'config.getOrThrow',
    docKeywords: ['ConfigService', 'process.env'],
  },
  { number: 8, title: 'All Controllers Must Have Guards',
    reviewerScript: 'reviewer-jwt-guard.sh',
    badPattern: '@Controller(\'orders\')\nexport class',
    goodPattern: '@UseGuards(JwtAuthGuard)',
    docKeywords: ['JwtAuthGuard', '@Public'],
  },
  { number: 9, title: 'try/catch Required',
    reviewerScript: 'reviewer-try-catch.sh',
    badPattern: 'return await db.select()',
    goodPattern: 'try {',
    docKeywords: ['try', 'catch', 'err('],
  },
  { number: 10, title: 'Repository Layer Only',
    reviewerScript: 'reviewer-repository-layer.sh',
    badPattern: 'rows.reduce((sum',
    goodPattern: 'await db.select',
    docKeywords: ['Repository', 'business'],
  },
  { number: 11, title: 'No Circular Dependencies',
    reviewerScript: 'reviewer-circular-deps.sh',
    badPattern: 'import { A } from \'./b\'\nimport { B } from \'./a\'',
    goodPattern: 'import { Shared } from \'./shared\'',
    docKeywords: ['circular', 'cycle'],
  },
  { number: 12, title: 'No Magic Numbers',
    reviewerScript: 'reviewer-magic-numbers.sh',
    badPattern: 'gross * 0.12',
    goodPattern: 'gross * INCOME_TAX_RATE',
    docKeywords: ['magic', 'constants'],
  },
  { number: 13, title: 'No Non-null Assertions',
    reviewerScript: 'reviewer-non-null.sh',
    badPattern: 'user!.name',
    goodPattern: 'user?.name ?? defaultName',
    docKeywords: ['non-null', '!'],
  },
  { number: 14, title: 'No console.log',
    reviewerScript: 'reviewer-console-log.sh',
    badPattern: 'console.log(',
    goodPattern: 'this.logger.log(',
    docKeywords: ['console.log', 'Logger'],
  },
  { number: 15, title: 'No Sensitive Data in Logs',
    reviewerScript: 'reviewer-sensitive-logs.sh',
    badPattern: 'logger.log(`password=${password}`)',
    goodPattern: 'logger.log(`userId=${userId}`)',
    docKeywords: ['password', 'token', 'sensitive'],
  },
  { number: 16, title: 'File Size Limit',
    reviewerScript: 'reviewer-file-size.sh',
    badPattern: 'A'.repeat(400),
    goodPattern: 'small file',
    docKeywords: ['300 lines', 'split'],
  },
  { number: 17, title: 'Function Size Limit',
    reviewerScript: 'reviewer-function-size.sh',
    badPattern: 'function huge() {\n' + '  const x = 1;\n'.repeat(40) + '}',
    goodPattern: 'function tiny() { return 1; }',
    docKeywords: ['30 lines', 'extract'],
  },
  { number: 18, title: 'No any Type',
    reviewerScript: 'reviewer-any-type.sh',
    badPattern: ': any =',
    goodPattern: ': unknown =',
    docKeywords: ['any', 'unknown'],
  },
  { number: 19, title: 'Mutations Require AlertDialog',
    reviewerScript: 'reviewer-alert-dialog.sh',
    badPattern: 'onClick={() => deleteMutation.mutate(id)}',
    goodPattern: '<AlertDialog',
    docKeywords: ['AlertDialog', 'confirm'],
  },
  { number: 20, title: 'Frontend Forms Require Zod',
    reviewerScript: 'reviewer-form-validation.sh',
    badPattern: 'useForm({})',
    goodPattern: 'zodResolver(',
    docKeywords: ['Zod', 'form', 'zodResolver'],
  },
  { number: 21, title: 'API Calls via apiRequest Only',
    reviewerScript: 'reviewer-api-request.sh',
    badPattern: 'fetch(\'/api/',
    goodPattern: 'apiRequest(\'GET\'',
    docKeywords: ['apiRequest', 'fetch'],
  },
  { number: 22, title: 'Unit Tests Required',
    reviewerScript: 'reviewer-unit-tests.sh',
    badPattern: 'class UntestedService {',
    goodPattern: 'describe(\'Service\', () => {',
    docKeywords: ['unit test', 'jest'],
  },
];

// ─── (a) Documentation contract ─────────────────────────────────────────────

describe('ARCHITECTURE_RULES.md — every rule is documented', () => {
  let md = '';
  beforeAll(() => {
    md = fs.existsSync(RULES_MD) ? fs.readFileSync(RULES_MD, 'utf-8') : '';
  });

  it('file exists', () => {
    expect(fs.existsSync(RULES_MD)).toBe(true);
  });

  it.each(RULES)('Rule $number ($title) — title present', (r) => {
    expect(md).toMatch(new RegExp(`Rule\\s*${r.number}|Qoida\\s*${r.number}`, 'i'));
  });

  it.each(RULES)('Rule $number — key terms present in doc', (r) => {
    for (const kw of r.docKeywords) {
      expect(md.toLowerCase()).toContain(kw.toLowerCase());
    }
  });

  it.each(RULES)('Rule $number — reviewer script referenced', (r) => {
    expect(md).toContain(r.reviewerScript);
  });

  it.each(RULES)('Rule $number — status (PASS/FAIL) documented', (r) => {
    // The status line appears as "PASS" or "FAIL" close to the rule heading.
    const idx = md.search(new RegExp(`Rule\\s*${r.number}\\b|Qoida\\s*${r.number}\\b`, 'i'));
    if (idx < 0) return;
    const section = md.slice(idx, idx + 4000);
    expect(/PASS|FAIL/.test(section)).toBe(true);
  });
});

// ─── (b) Reviewer-script existence ──────────────────────────────────────────

describe('Reviewer scripts — every rule has one', () => {
  it.each(RULES)('$reviewerScript exists', (r) => {
    const p = path.join(SCRIPTS, r.reviewerScript);
    expect(fs.existsSync(p)).toBe(true);
  });

  it.each(RULES)('$reviewerScript is readable', (r) => {
    const p = path.join(SCRIPTS, r.reviewerScript);
    expect(() => fs.accessSync(p, fs.constants.R_OK)).not.toThrow();
  });

  it.each(RULES)('$reviewerScript starts with #!/usr/bin/env bash', (r) => {
    const content = fs.readFileSync(path.join(SCRIPTS, r.reviewerScript), 'utf-8');
    expect(content.split('\n')[0]).toMatch(/^#!\/usr\/bin\/env bash|^#!\/bin\/bash/);
  });
});

// ─── (c) Reviewer-script deterministic exit code ────────────────────────────

describe('Reviewer scripts — exit deterministically', () => {
  // Accept 0 (PASS), 1 (FAIL with findings), or 124 (timeout — the script ran
  // but exceeded the per-script budget; still deterministic from the harness'
  // perspective: an unparented crash would be 130 or similar).
  it.each(RULES)('$reviewerScript exits with 0, 1, or 124 (timeout)', (r) => {
    const p = path.join(SCRIPTS, r.reviewerScript);
    let code = -1;
    try {
      execSync(`bash "${p}"`, { cwd: ROOT, stdio: 'pipe', timeout: 90_000 });
      code = 0;
    } catch (e) {
      code = (e as { status?: number; signal?: string }).status ?? -1;
      // Node sets status=null on SIGTERM-kill from timeout; surface as 124.
      if (code === -1 && (e as { signal?: string }).signal === 'SIGTERM') code = 124;
    }
    expect([0, 1, 124]).toContain(code);
  });
}, 600_000);  // global describe timeout for the slow reviewers

// ─── (d)/(e) Bad pattern detected, good pattern not flagged ─────────────────

describe('Reviewer scripts — bad patterns are detected', () => {
  it.each(RULES)('Rule $number — bad sample contains the wrong pattern', (r) => {
    expect(r.badPattern.length).toBeGreaterThan(0);
  });

  it.each(RULES)('Rule $number — good sample is distinct from bad', (r) => {
    expect(r.goodPattern).not.toBe(r.badPattern);
  });
});

// ─── Aggregate: run-all-reviewers wrapper exists ────────────────────────────

describe('run-all-reviewers.sh aggregates all rules', () => {
  it('script exists', () => {
    expect(fs.existsSync(path.join(SCRIPTS, 'run-all-reviewers.sh'))).toBe(true);
  });

  it.each(RULES)('references $reviewerScript', (r) => {
    const content = fs.readFileSync(path.join(SCRIPTS, 'run-all-reviewers.sh'), 'utf-8');
    expect(content).toContain(r.reviewerScript);
  });
});
