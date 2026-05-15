/**
 * @module budget-tracker.service
 * @description Per-user, per-day spending guard. Backed by Redis (or any
 * counter-like store via the IBudgetStore port) so multiple API replicas
 * share the count.
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { AishaConfig } from '../../config/aisha.config';

export interface IBudgetStore {
  get(key: string):                          Promise<number>;
  incrBy(key: string, amount: number, ttlSec: number): Promise<number>;
}

export const BUDGET_STORE = Symbol('AISHA_BUDGET_STORE');

const ONE_DAY_SEC = 86_400;

@Injectable()
export class BudgetTrackerService {
  constructor(
    private readonly cfg: AishaConfig,
    @Optional() @Inject(BUDGET_STORE) private readonly store: IBudgetStore | null = null,
  ) {}

  private keyFor(userId: number): string {
    const ymd = new Date().toISOString().slice(0, 10);
    return `aisha:budget:${userId}:${ymd}`;
  }

  async checkBudget(userId: number, estimatedUSDCents: number): Promise<Result<{ remaining: number }>> {
    if (!this.store) return Ok({ remaining: this.cfg.dailyBudgetUSD * 100 });
    const spent = await this.store.get(this.keyFor(userId));
    const budgetCents = this.cfg.dailyBudgetUSD * 100;
    const remaining = budgetCents - spent;
    if (remaining < estimatedUSDCents) {
      return Err(AppErr('PAYMENT_REQUIRED', `Bugungi byudjet tugadi (qoldiq: ${(remaining / 100).toFixed(2)} USD)`));
    }
    return Ok({ remaining });
  }

  async recordSpend(userId: number, actualUSDCents: number): Promise<Result<{ totalCents: number }>> {
    if (!this.store) return Ok({ totalCents: 0 });
    const total = await this.store.incrBy(this.keyFor(userId), actualUSDCents, ONE_DAY_SEC);
    return Ok({ totalCents: total });
  }
}
