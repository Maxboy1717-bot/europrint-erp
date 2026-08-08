/**
 * @module i-sd-customer-abc.repo
 * @description Port for T18-C4 customer ABC segmentation data access.
 */

import { Result, AppError } from '@common/result';

export const SD_CUSTOMER_ABC_REPO = Symbol('SD_CUSTOMER_ABC_REPO');

/** One customer's last-12-month purchase revenue. */
export interface CustomerAnnualRevenue {
  id: number;
  name: string;
  annualRevenue: number;
}

export interface ISdCustomerAbcRepo {
  /** Read each active customer's last-12-month purchase revenue from live sales_orders. */
  getAnnualRevenue(): Promise<Result<CustomerAnnualRevenue[], AppError>>;
  /** Persist computed ABC classes onto sd_customers.abc_class. Returns rows updated. */
  persistAbc(rows: Array<{ id: number; abcClass: 'A' | 'B' | 'C' }>): Promise<Result<number, AppError>>;
}
