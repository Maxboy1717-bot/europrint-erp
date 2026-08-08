/**
 * lead-aging-reassign.cron.spec.ts
 *
 * VISION-3340 #33 — LeadAgingReassignCron: finds leads that have gone cold for
 * 60+ days (COALESCE(last_activity_at, created_at) aging, non-terminal status)
 * and reassigns each to the next round-robin sales manager via the
 * `overwrite=true` opt-in path of `WebsiteLeadRepository.assignManagerIfMissing`,
 * logging a `crm_activities` audit note for every real reassignment.
 *
 * The repository is mocked (constructor-injected directly, no Nest TestingModule
 * needed for a single-dependency class) — matches the sibling cron-spec style
 * (e.g. test/cron/recurring-journal-entries.cron.spec.ts).
 */

import { LeadAgingReassignCron } from '../../src/modules/crm/cron/lead-aging-reassign.cron';
import { WebsiteLeadRepository } from '../../src/modules/crm/listeners/website-lead.repository';
import { Ok, Err, AppErr } from '../../src/common/result';
import { CRM_LEAD_AGING_REASSIGN_DAYS, CRM_LEAD_TERMINAL_STATUSES } from '../../src/common/constants/business.constants';

type RepoMock = {
  findColdLeadsForReassignment: jest.Mock;
  pickNextSalesManager: jest.Mock;
  assignManagerIfMissing: jest.Mock;
  logLeadReassignmentNote: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    findColdLeadsForReassignment: jest.fn(),
    pickNextSalesManager: jest.fn(),
    assignManagerIfMissing: jest.fn(),
    logLeadReassignmentNote: jest.fn(),
  };
}

describe('LeadAgingReassignCron', () => {
  let repo: RepoMock;
  let cron: LeadAgingReassignCron;

  beforeEach(() => {
    repo = makeRepo();
    cron = new LeadAgingReassignCron(repo as unknown as WebsiteLeadRepository);
  });

  it('does nothing when no cold leads are found', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([]));

    await cron.reassignColdLeads();

    expect(repo.findColdLeadsForReassignment).toHaveBeenCalledWith(
      CRM_LEAD_AGING_REASSIGN_DAYS,
      CRM_LEAD_TERMINAL_STATUSES,
    );
    expect(repo.pickNextSalesManager).not.toHaveBeenCalled();
    expect(repo.assignManagerIfMissing).not.toHaveBeenCalled();
  });

  it('logs and returns early when the cold-lead lookup itself fails (never fabricates success)', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Err(AppErr('DB_ERROR', 'connection lost')));

    await cron.reassignColdLeads();

    expect(repo.pickNextSalesManager).not.toHaveBeenCalled();
  });

  it('reassigns a cold lead to a different manager with overwrite=true and logs an audit note', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([{ id: 501, managerId: 7 }]));
    repo.pickNextSalesManager.mockResolvedValue(Ok(12));
    repo.assignManagerIfMissing.mockResolvedValue(Ok(true));
    repo.logLeadReassignmentNote.mockResolvedValue(Ok(undefined));

    await cron.reassignColdLeads();

    expect(repo.assignManagerIfMissing).toHaveBeenCalledWith(501, 12, true);
    expect(repo.logLeadReassignmentNote).toHaveBeenCalledWith(501, 7, 12, CRM_LEAD_AGING_REASSIGN_DAYS);
  });

  it('reassigns an unassigned (null manager) cold lead', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([{ id: 502, managerId: null }]));
    repo.pickNextSalesManager.mockResolvedValue(Ok(3));
    repo.assignManagerIfMissing.mockResolvedValue(Ok(true));
    repo.logLeadReassignmentNote.mockResolvedValue(Ok(undefined));

    await cron.reassignColdLeads();

    expect(repo.assignManagerIfMissing).toHaveBeenCalledWith(502, 3, true);
    expect(repo.logLeadReassignmentNote).toHaveBeenCalledWith(502, null, 3, CRM_LEAD_AGING_REASSIGN_DAYS);
  });

  it('skips reassignment when round-robin picks the same manager already on the lead (no-op, no note)', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([{ id: 503, managerId: 9 }]));
    repo.pickNextSalesManager.mockResolvedValue(Ok(9));

    await cron.reassignColdLeads();

    expect(repo.assignManagerIfMissing).not.toHaveBeenCalled();
    expect(repo.logLeadReassignmentNote).not.toHaveBeenCalled();
  });

  it('skips a lead when no active sales manager is available (never assigns a null/0 manager)', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([{ id: 504, managerId: 1 }]));
    repo.pickNextSalesManager.mockResolvedValue(Ok(null));

    await cron.reassignColdLeads();

    expect(repo.assignManagerIfMissing).not.toHaveBeenCalled();
    expect(repo.logLeadReassignmentNote).not.toHaveBeenCalled();
  });

  it('does not log an audit note when the reassignment update itself reports failure', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([{ id: 505, managerId: 4 }]));
    repo.pickNextSalesManager.mockResolvedValue(Ok(6));
    repo.assignManagerIfMissing.mockResolvedValue(Ok(false));

    await cron.reassignColdLeads();

    expect(repo.logLeadReassignmentNote).not.toHaveBeenCalled();
  });

  it('processes multiple cold leads sequentially, each with its own round-robin pick', async () => {
    repo.findColdLeadsForReassignment.mockResolvedValue(Ok([
      { id: 601, managerId: 1 },
      { id: 602, managerId: 2 },
    ]));
    repo.pickNextSalesManager
      .mockResolvedValueOnce(Ok(5))
      .mockResolvedValueOnce(Ok(8));
    repo.assignManagerIfMissing.mockResolvedValue(Ok(true));
    repo.logLeadReassignmentNote.mockResolvedValue(Ok(undefined));

    await cron.reassignColdLeads();

    expect(repo.pickNextSalesManager).toHaveBeenCalledTimes(2);
    expect(repo.assignManagerIfMissing).toHaveBeenNthCalledWith(1, 601, 5, true);
    expect(repo.assignManagerIfMissing).toHaveBeenNthCalledWith(2, 602, 8, true);
  });
});
