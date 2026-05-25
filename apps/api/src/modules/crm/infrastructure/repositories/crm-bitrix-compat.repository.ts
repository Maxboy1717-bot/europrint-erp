/**
 * @module crm-bitrix-compat.repository (infrastructure)
 * @description Drizzle implementation of {@link ICrmBitrixCompatRepo}.
 *   Wave 13 PR1 — umbrella that delegates to 3 external-dep sub-repos
 *   (proposals / robots / invoices). Provider symbol
 *   `CRM_BITRIX_COMPAT_REPO` and consumers are unchanged.
 * @layer Infrastructure (CRM)
 */

import { Injectable } from '@nestjs/common';
import type { Result } from '@common/result';
import type { ICrmBitrixCompatRepo } from '../../domain/repositories/i-crm-bitrix-compat.repo';
import { CrmBitrixCompatProposalsRepository } from './crm-bitrix-compat-proposals.repository';
import { CrmBitrixCompatRobotsRepository } from './crm-bitrix-compat-robots.repository';
import { CrmBitrixCompatInvoicesRepository } from './crm-bitrix-compat-invoices.repository';

type Row = Record<string, unknown>;

@Injectable()
export class CrmBitrixCompatRepository implements ICrmBitrixCompatRepo {
  constructor(
    private readonly proposals: CrmBitrixCompatProposalsRepository,
    private readonly robots: CrmBitrixCompatRobotsRepository,
    private readonly invoices: CrmBitrixCompatInvoicesRepository,
  ) {}

  listProposals(lim: number, off: number): Promise<Result<Row[]>> {
    return this.proposals.listProposals(lim, off);
  }
  deleteProposal(id: number): Promise<void> {
    return this.proposals.deleteProposal(id);
  }
  updateProposalStage(id: number, status: string): Promise<Result<Row | null>> {
    return this.proposals.updateProposalStage(id, status);
  }

  listRobots(lim: number, off: number): Promise<Result<Row[]>> { return this.robots.listRobots(lim, off); }
  getRobot(id: number): Promise<Result<Row | null>>            { return this.robots.getRobot(id); }
  createRobot(body: Row): Promise<Result<Row | null>>          { return this.robots.createRobot(body); }
  updateRobot(id: number, body: Row): Promise<Result<Row | null>> { return this.robots.updateRobot(id, body); }
  toggleRobot(id: number): Promise<Result<Row | null>>         { return this.robots.toggleRobot(id); }
  deleteRobot(id: number): Promise<void>                       { return this.robots.deleteRobot(id); }

  listInvoices(lim: number, off: number): Promise<Result<Row[]>> {
    return this.invoices.listInvoices(lim, off);
  }
  deleteInvoice(id: number): Promise<void> {
    return this.invoices.deleteInvoice(id);
  }
  updateInvoiceStage(id: number, status: string): Promise<Result<Row | null>> {
    return this.invoices.updateInvoiceStage(id, status);
  }
}
