/**
 * @module schema-finance
 * @description Finance schema barrel — re-exports invoicing, budgets,
 *   extended stubs, and report snapshots. The actual table definitions
 *   live in `schema-finance-*.ts` split files so each stays under 300 lines.
 */

export * from './schema-finance-invoicing';
export * from './schema-finance-budgets';
export * from './schema-finance-extended';
export * from './schema-finance-reports';
