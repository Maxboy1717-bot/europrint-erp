/**
 * @module schema-pos-retail
 * @description Source module. See exports for details.
 */

import {
  pgTable, uuid, text, boolean, timestamp,
  decimal, integer, jsonb, index,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { retailPosProducts as retail_pos_products } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { retailPosTransactions as retail_pos_transactions } from '@workspace/db';
