/**
 * @module i-crm-bitrix-compat.repo
 * @description Domain repository interface for Bitrix-compatible CRM data
 *   (proposals / invoices / robots). Concrete implementation at
 *   `infrastructure/repositories/crm-bitrix-compat.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_BITRIX_COMPAT_REPO = Symbol('CRM_BITRIX_COMPAT_REPO');

export interface ICrmBitrixCompatRepo {
  listProposals(lim: number, off: number): Promise<Result<Row[]>>;
  listInvoices(lim: number, off: number): Promise<Result<Row[]>>;
  listRobots(lim: number, off: number): Promise<Result<Row[]>>;
  getRobot(id: number): Promise<Result<Row | null>>;
  createRobot(body: Row): Promise<Result<Row | null>>;
  updateRobot(id: number, body: Row): Promise<Result<Row | null>>;
  toggleRobot(id: number): Promise<Result<Row | null>>;
  deleteRobot(id: number): Promise<void>;
  deleteProposal(id: number): Promise<void>;
  deleteInvoice(id: number): Promise<void>;
  updateProposalStage(id: number, status: string): Promise<Result<Row | null>>;
  updateInvoiceStage(id: number, status: string): Promise<Result<Row | null>>;
}
