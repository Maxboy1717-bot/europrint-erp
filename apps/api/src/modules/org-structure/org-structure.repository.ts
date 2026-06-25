/**
 * @module org-structure.repository
 * @description Repository facade. Implementation split into ./org-structure/
 *   for Rule 16 — original import path preserved.
 */

import { Injectable } from '@nestjs/common';
import { OrgQueriesRepo } from './org-structure/org-queries.repo';
import { OrgMutationsRepo } from './org-structure/org-mutations.repo';

export { OrgQueriesRepo, OrgMutationsRepo };

@Injectable()
export class OrgStructureRepository {
  constructor(
    private readonly queries: OrgQueriesRepo,
    private readonly mutations: OrgMutationsRepo,
  ) {}

  // ─── Queries ─────────────────────────────────────────────────────────────
  getHierarchyNodes = () => this.queries.getHierarchyNodes();
  getStats = () => this.queries.getStats();
  getFlat = (s: unknown, t: unknown, p: number, l: number) => this.queries.getFlat(s, t, p, l);
  findOneWithDetails = (id: number) => this.queries.findOneWithDetails(id);
  getParentLevel = (pid: unknown) => this.queries.getParentLevel(pid);
  existsById = (id: number) => this.queries.existsById(id);
  availableUsers = () => this.queries.availableUsers();
  getApprovalChain = (id: number) => this.queries.getApprovalChain(id);
  getDirectManager = (id: number) => this.queries.getDirectManager(id);
  getTelegramGroupForNode = (id: number) => this.queries.getTelegramGroupForNode(id);
  // P51 — derive manager up the parent chain (vizyon §2.3 Q1/Q4)
  deriveManagerForNode = (nodeId: number) => this.queries.deriveManagerForNode(nodeId);

  // ─── Mutations ───────────────────────────────────────────────────────────
  create = (dto: Record<string, unknown>, lvl: number) => this.mutations.create(dto, lvl);
  updateFromDto = (id: number, dto: Record<string, unknown>) => this.mutations.updateFromDto(id, dto);
  deactivate = (id: number) => this.mutations.deactivate(id);
  move = (id: number, parent: number | null, lvl: number) => this.mutations.move(id, parent, lvl);
  assignUser = (uid: number, nid: number, stake: number | null = null, overload = false) =>
    this.mutations.assignUser(uid, nid, stake, overload);
  removeUser = (uid: number, nid: number) => this.mutations.removeUser(uid, nid);
  // P51 — backfill manager_id from the org tree (DATA-gated, idempotent)
  backfillManagerIds = (dryRun: boolean) => this.mutations.backfillManagerIds(dryRun);
}
