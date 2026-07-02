/**
 * ckp-fact.service.spec.ts — CkpFactService (EP-ORG-014..018).
 *
 * Behavioural coverage for the achievement% formula engine (calcAchievement,
 * private — exercised via the public recordFact() entrypoint) and the
 * norma+formula resolution ladder (karta-global -> karta-mahsulot(#10) ->
 * shaxsiy-norma(#14)). Repo is mocked (this is a domain-logic orchestration
 * unit — the real SQL lives in CkpFactRepository and is exercised against
 * the live DB separately, matching the org-cascade.spec.ts precedent).
 */

import { CkpFactService } from '../src/modules/org-structure/ckp-fact.service';
import type { CkpFactRepository } from '../src/modules/org-structure/ckp-fact.repository';
import { Ok, Err } from '../src/common/result';

type Row = Record<string, unknown>;

interface FakeCkpFactRepo {
  cardCkpMeta: jest.Mock;
  cardProductTarget: jest.Mock;
  personalTarget: jest.Mock;
  upsertFact: jest.Mock;
  listByCard: jest.Mock;
  aggregateByDate: jest.Mock;
}

function makeRepo(meta: Row | null, overrides: Partial<FakeCkpFactRepo> = {}): FakeCkpFactRepo {
  return {
    cardCkpMeta: jest.fn().mockResolvedValue(Ok(meta)),
    cardProductTarget: jest.fn().mockResolvedValue(Ok(null)),
    personalTarget: jest.fn().mockResolvedValue(Ok(null)),
    // upsertFact echoes the input back as a ckp_fact_values row (snake_case
    // DB columns, mirroring `RETURNING *` in the real repo) so the test can
    // assert exactly what the service computed and asked to persist.
    upsertFact: jest.fn().mockImplementation((input: Record<string, unknown>) =>
      Promise.resolve(Ok({
        id: 1,
        card_id: input['cardId'],
        employee_id: input['employeeId'] ?? null,
        product_id: input['productId'] ?? null,
        fact_date: input['factDate'],
        target_value: input['targetValue'] ?? null,
        actual_value: input['actualValue'] ?? null,
        achievement_pct: input['achievementPct'],
        source: input['source'],
        formula_type: input['formulaType'] ?? null,
        error_code: input['errorCode'] ?? null,
        notes: input['notes'] ?? null,
        recorded_by: input['recordedBy'] ?? null,
      }))),
    listByCard: jest.fn().mockResolvedValue(Ok([])),
    aggregateByDate: jest.fn().mockResolvedValue(Ok(null)),
    ...overrides,
  };
}

function service(repo: FakeCkpFactRepo): CkpFactService {
  // Single-arg constructor (no EventEmitter2) — matches the documented
  // unit-test back-compat path in ckp-fact.service.ts's constructor comment.
  return new CkpFactService(repo as unknown as CkpFactRepository);
}

describe('CkpFactService.recordFact — achievement% formula engine', () => {
  it('quantity_pct (default): achievement = actual/target * 100', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 100, tskp_formula_type: 'quantity_pct' });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 75 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['achievement_pct']).toBe(75);
    expect(r.data['target_value']).toBe(100);
  });

  it('quantity_pct: norma (tskp_target) NULL -> achievement 0 (FABRIKATSIYA YO\'Q, no fake %)', async () => {
    const repo = makeRepo({ id: 1, tskp_target: null, tskp_formula_type: 'quantity_pct' });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 999 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['achievement_pct']).toBe(0);
    expect(r.data['target_value']).toBeNull();
  });

  it('boolean: actual > 0 -> 100, actual <= 0 -> 0', async () => {
    const repo = makeRepo({ id: 1, tskp_target: null, tskp_formula_type: 'boolean' });
    const ok = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 1 });
    const notOk = await service(makeRepo({ id: 1, tskp_target: null, tskp_formula_type: 'boolean' }))
      .recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 0 });

    expect(ok.ok && ok.data['achievement_pct']).toBe(100);
    expect(notOk.ok && notOk.data['achievement_pct']).toBe(0);
  });

  it('foiz: actual IS the percentage (no norma needed), clamped to 100', async () => {
    const repo = makeRepo({ id: 1, tskp_target: null, tskp_formula_type: 'foiz' });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 87.5 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['achievement_pct']).toBe(87.5);

    const repoOver = makeRepo({ id: 1, tskp_target: null, tskp_formula_type: 'foiz' });
    const rOver = await service(repoOver).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 150 });
    expect(rOver.ok).toBe(true);
    if (!rOver.ok) return;
    expect(rOver.data['achievement_pct']).toBe(100); // clamp 0..100
  });

  it('vaqt: inverse ratio norma/actual (reja-vaqt <= haqiqiy-vaqt = 100%)', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 8, tskp_formula_type: 'vaqt' });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 10 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['achievement_pct']).toBe(80); // (8/10)*100
  });

  it('vaqt: actual <= 0 -> 0 (FABRIKATSIYA YO\'Q)', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 8, tskp_formula_type: 'vaqt' });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['achievement_pct']).toBe(0);
  });

  it('unknown/absent formula type falls back to CKP_DEFAULT_FORMULA_TYPE (quantity_pct)', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 50, tskp_formula_type: null, ckp_formula_type: null });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 25 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['achievement_pct']).toBe(50); // 25/50*100
    expect(r.data['formula_type']).toBe('quantity_pct');
  });
});

describe('CkpFactService.recordFact — norma/formula resolution ladder', () => {
  it('karta-mahsulot (#10) target overrides karta-global when productId supplied', async () => {
    const repo = makeRepo(
      { id: 1, tskp_target: 100, tskp_formula_type: 'quantity_pct' },
      { cardProductTarget: jest.fn().mockResolvedValue(Ok({ target_value: 40, formula_type: 'quantity_pct' })) },
    );
    const r = await service(repo).recordFact({ cardId: 1, productId: 9, factDate: '2020-01-01', actualValue: 20 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['target_value']).toBe(40);
    expect(r.data['achievement_pct']).toBe(50); // 20/40*100 (not 20/100)
    expect(repo.cardProductTarget).toHaveBeenCalledWith(1, 9);
  });

  it('shaxsiy-norma (#14) overrides karta-mahsulot when employeeId supplied (most specific wins)', async () => {
    const repo = makeRepo(
      { id: 1, tskp_target: 100, tskp_formula_type: 'quantity_pct' },
      {
        cardProductTarget: jest.fn().mockResolvedValue(Ok({ target_value: 40, formula_type: 'quantity_pct' })),
        personalTarget: jest.fn().mockResolvedValue(Ok({ target_value: 10, formula_type: 'boolean' })),
      },
    );
    const r = await service(repo).recordFact({
      cardId: 1, productId: 9, employeeId: 55, factDate: '2020-06-15', actualValue: 5,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['target_value']).toBe(10);
    expect(r.data['formula_type']).toBe('boolean');
    expect(r.data['achievement_pct']).toBe(100); // boolean: actual(5) > 0
    expect(repo.personalTarget).toHaveBeenCalledWith(1, 55, 9, '2020-06');
  });

  it('card not found -> NOT_FOUND, upsertFact never called', async () => {
    const repo = makeRepo(null);
    const r = await service(repo).recordFact({ cardId: 999, factDate: '2020-01-01', actualValue: 1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.upsertFact).not.toHaveBeenCalled();
  });

  it('repo failure on cardCkpMeta propagates as Err without calling upsertFact', async () => {
    const repo = makeRepo(null, { cardCkpMeta: jest.fn().mockResolvedValue(Err({ code: 'INTERNAL', message: 'db down' })) });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 1 });
    expect(r.ok).toBe(false);
    expect(repo.upsertFact).not.toHaveBeenCalled();
  });
});

describe('CkpFactService.recordFact — deadline flag (gate)', () => {
  it('deadlineHours NULL -> no deadline rule (FABRIKATSIYA YO\'Q): passed=false, at=null', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 10, tskp_formula_type: 'quantity_pct', ckp_report_deadline_hours: null });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2020-01-01', actualValue: 10 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['deadline_hours']).toBeNull();
    expect(r.data['deadline_at']).toBeNull();
    expect(r.data['deadline_passed']).toBe(false);
  });

  it('deadline computed as factDate+1day+deadlineHours; long-past factDate -> passed=true', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 10, tskp_formula_type: 'quantity_pct', ckp_report_deadline_hours: 24 });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2000-01-01', actualValue: 10 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // dayStart(2000-01-01T00:00Z) + 1 day + 24h = 2000-01-03T00:00:00.000Z
    expect(r.data['deadline_at']).toBe('2000-01-03T00:00:00.000Z');
    expect(r.data['deadline_hours']).toBe(24);
    expect(r.data['deadline_passed']).toBe(true);
  });

  it('far-future factDate -> deadline not yet passed', async () => {
    const repo = makeRepo({ id: 1, tskp_target: 10, tskp_formula_type: 'quantity_pct', ckp_report_deadline_hours: 1 });
    const r = await service(repo).recordFact({ cardId: 1, factDate: '2099-01-01', actualValue: 10 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data['deadline_passed']).toBe(false);
  });
});

describe('CkpFactService — thin passthrough reads', () => {
  it('listByCard delegates to repo.listByCard with the same args', async () => {
    const repo = makeRepo(null, { listByCard: jest.fn().mockResolvedValue(Ok([{ id: 1 }])) });
    const r = await service(repo).listByCard(1, '2020-01-01', '2020-01-31');
    expect(r.ok).toBe(true);
    expect(repo.listByCard).toHaveBeenCalledWith(1, '2020-01-01', '2020-01-31');
  });

  it('aggregate delegates to repo.aggregateByDate with the same args', async () => {
    const repo = makeRepo(null, { aggregateByDate: jest.fn().mockResolvedValue(Ok({ fact_count: 3, avg_achievement: 66.5 })) });
    const r = await service(repo).aggregate(1, '2020-01-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ fact_count: 3, avg_achievement: 66.5 });
    expect(repo.aggregateByDate).toHaveBeenCalledWith(1, '2020-01-01');
  });
});
