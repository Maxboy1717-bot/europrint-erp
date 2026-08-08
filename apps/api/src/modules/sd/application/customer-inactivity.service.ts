/**
 * @module customer-inactivity.service
 * @description 06-sd #27 — win-back trigger source. Delegates the nightly
 *   inactive-customer sweep + rule read to the repo (Qoida 15). Thresholds live
 *   in crm_inactivity_rules (A=90/B=60/C=30, seeded), never fabricated here.
 *   Result<T> throughout (Qoida 1).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, safeCall, AppError } from '@common/result';
import {
  DrizzleCustomerInactivityRepository,
  type InactivityRule,
  type InactivityRefresh,
} from '../infrastructure/repositories/drizzle-customer-inactivity.repo';

@Injectable()
export class CustomerInactivityService {
  private readonly logger = new Logger(CustomerInactivityService.name);

  constructor(private readonly repo: DrizzleCustomerInactivityRepository) {}

  /** Read the seeded per-ABC inactivity thresholds (A=90/B=60/C=30). */
  async getRules(): Promise<Result<InactivityRule[], AppError>> {
    return this.repo.listRules();
  }

  /** Run the sweep; returns swept + flagged counts alongside the active rules. */
  async refresh(): Promise<Result<{ evaluated: number; flagged: number; rules: InactivityRule[] }, AppError>> {
    return safeCall(async () => {
      const sweep = await this.repo.refreshInactivity();
      const data: InactivityRefresh = sweep.ok ? sweep.data : { evaluated: 0, flagged: 0 };
      const rulesR = await this.repo.listRules();
      const rules = rulesR.ok ? rulesR.data : [];
      this.logger.log(`Customer inactivity sweep: evaluated=${data.evaluated} flagged=${data.flagged}`);
      return { evaluated: data.evaluated, flagged: data.flagged, rules };
    });
  }
}
