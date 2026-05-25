/**
 * @module ai-usage-logs.table
 * @description Re-export of the canonical `ai_usage_logs` table that lives in
 *              `@shared/db/schema-finance-reports.ts`. Kept as a thin shim so
 *              existing imports (`from './ai-usage-logs.table'`) keep working.
 *              The legacy `aiUsageLogsTable` alias is exported alongside the
 *              shared `ai_usage_logs` name.
 */

import { ai_usage_logs } from '@shared/db';

export { ai_usage_logs };
export const aiUsageLogsTable = ai_usage_logs;
