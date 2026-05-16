/**
 * @module budget-tracker.spec
 */

import {
  BudgetTrackerService,
  type IBudgetStore,
} from '../../src/modules/aisha/application/llm/budget-tracker.service';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function fakeCfg(usd = 5): AishaConfig {
  return { dailyBudgetUSD: usd } as unknown as AishaConfig;
}

function memStore(): IBudgetStore & { _data: Map<string, number> } {
  const data = new Map<string, number>();
  return {
    _data: data,
    get: (k) => Promise.resolve(data.get(k) ?? 0),
    incrBy: (k, n) => { data.set(k, (data.get(k) ?? 0) + n); return Promise.resolve(data.get(k) ?? 0); },
  };
}

describe('BudgetTrackerService', () => {
  it('passes when within budget', async () => {
    const svc = new BudgetTrackerService(fakeCfg(), memStore());
    const r = await svc.checkBudget(1, 10);
    expect(r.ok).toBe(true);
  });

  it('fails when over budget', async () => {
    const store = memStore();
    await store.incrBy('aisha:budget:1:' + new Date().toISOString().slice(0, 10), 500, 86400);
    const svc = new BudgetTrackerService(fakeCfg(5), store);
    const r = await svc.checkBudget(1, 10);
    expect(r.ok).toBe(false);
  });

  it('recordSpend increments counter', async () => {
    const store = memStore();
    const svc = new BudgetTrackerService(fakeCfg(), store);
    await svc.recordSpend(2, 7);
    expect(Array.from(store._data.values())[0]).toBe(7);
  });

  it('returns full budget when no store available', async () => {
    const svc = new BudgetTrackerService(fakeCfg(5), null);
    const r = await svc.checkBudget(1, 1);
    expect(r.ok && r.data.remaining).toBe(500);
  });

  it('returns Ok with totalCents=0 when no store on recordSpend', async () => {
    const svc = new BudgetTrackerService(fakeCfg(5), null);
    const r = await svc.recordSpend(1, 7);
    expect(r.ok && r.data.totalCents).toBe(0);
  });

  it('tracks separate users separately', async () => {
    const store = memStore();
    const svc = new BudgetTrackerService(fakeCfg(), store);
    await svc.recordSpend(1, 10);
    await svc.recordSpend(2, 20);
    expect(store._data.size).toBe(2);
  });
});
