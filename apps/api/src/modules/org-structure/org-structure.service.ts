/**
 * @module org-structure.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { backfillEmployeeUserId } from '@common/database/ddl-migrations';
import { OrgStructureRepository } from './org-structure.repository';
import { ORG_CASCADE_EVENT } from './cascade/org-cascade.constants';
import { DepartmentCreatedEvent } from './cascade/department-created.event';

const ORG_DEFAULT_PAGE_LIMIT = 50;

@Injectable()
export class OrgStructureService implements OnModuleInit {
  private readonly logger = new Logger(OrgStructureService.name);

  constructor(
    private readonly repo: OrgStructureRepository,
    // Optional so existing single-arg tests (org-structure-move.spec) keep
    // working; injected at runtime by Nest for the EP-ORG-041 cascade.
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  /**
   * Self-heal the employees↔users link on boot. The communication-center
   * approver resolvers and org telegram-group lookups read `employees.user_id`,
   * which reseeds (hr-demo-seed / hr-full-seed) can leave NULL. The backfill is
   * idempotent + ADD-ONLY (touches only NULL rows), so this is a no-op once
   * linked. See apps/api/src/common/database/ddl-migrations.ts.
   */
  async onModuleInit(): Promise<void> {
    try {
      await backfillEmployeeUserId();
    } catch (e) {
      this.logger.warn(`employees.user_id backfill skipped: ${String(e)}`);
    }
  }

  async getHierarchy(): Promise<Result<object, AppError>> {
    const nodes = await this.repo.getHierarchyNodes();
    if (!nodes.ok) return Err(nodes.error.message);
    const nodeMap = new Map<number, Record<string, unknown>>();

    (Array.isArray(nodes?.data) ? nodes?.data : []).forEach(n => {
      nodeMap.set(Number(n.id), { ...n, children: [], employees: [], vacantCount: Number(n.vacantCardCount) || 0 });
    });

    const roots: Record<string, unknown>[] = [];
    (Array.isArray(nodes?.data) ? nodes?.data : []).forEach(n => {
      const node = nodeMap.get(Number(n.id));
      if (!node) return;
      if (n.parentId && nodeMap.has(Number(n.parentId))) {
        const parent = nodeMap.get(Number(n.parentId));
        if (parent) (parent.children as Record<string, unknown>[]).push(node);
      } else {
        roots.push(node);
      }
    });

    return Ok({ nodes: roots });
  }

  async getStats() {
    const s = await this.repo.getStats();
    if (!s.ok) return Err(s.error.message);
    const totalNodes = parseInt(String(s.data.totalNodes)) || 0;
    const totalEmployees = parseInt(String(s.data.totalEmployees)) || 0;
    const vacantCount = parseInt(String(s.data.vacantCount)) || 0;
    return Ok({
      totalNodes,
      totalDepartments: s.data.totalDepartments || 0,
      totalEmployees,
      vacantCount,
      vacantPercent: totalNodes > 0 ? Math.round((vacantCount / totalNodes) * 100) : 0,
      recentChanges: s.data.recentChanges || 0,
    });
  }

  async getFlat(query: Record<string, unknown> = {}) {
    return safeCall(async () => {
      const { search, nodeType, page = 1, limit = ORG_DEFAULT_PAGE_LIMIT } = query;
      const flatR = await this.repo.getFlat(search, nodeType, Number(page), Number(limit));
      const { rows, total } = (flatR.ok ? flatR.data : { rows: [], total: 0 }) as { rows: Record<string, unknown>[]; total: number };
      return {
        data: rows,
        pagination: { total, page: Number(page), limit: Number(limit) },
      };
    });
  }

  async findOne(id: number) {
    return safeCall(async () => {
      const detailsR = await this.repo.findOneWithDetails(id);
      const { node, employees, children } = (detailsR.ok ? detailsR.data : { node: {}, employees: [], children: [] }) as { node: Record<string, unknown>; employees: Record<string, unknown>[]; children: Record<string, unknown>[] };
      return { ...node, employees, children };
    });
  }

  async create(dto: Record<string, unknown>) {
    return safeCall(async () => {
      this.logger.log(`org structure: yaratilmoqda`);
      let level = 0;
      if (dto.parentId) {
        const levelR = await this.repo.getParentLevel(dto.parentId);
        level = levelR.ok ? (levelR.data as number) : 0;
      }
      const createdR = await this.repo.create(dto, level);

      // EP-ORG-041 (ORG-CASCADE, owner decision #13): publish AFTER commit so a
      // warehouse-bearing node auto-provisions a warehouse + grants the head the
      // warehouse RBAC role. Emitted on the canonical EventEmitter2 channel; the
      // OrgCascadeListener decides whether the node type is warehouse-bearing.
      if (createdR.ok && this.eventEmitter) {
        const row = createdR.data as Record<string, unknown>;
        const nodeId = Number(row.id);
        if (Number.isFinite(nodeId)) {
          this.eventEmitter.emit(
            ORG_CASCADE_EVENT,
            new DepartmentCreatedEvent(
              nodeId,
              String(row.node_type ?? (dto.nodeType as string) ?? 'department'),
              row.head_user_id != null ? Number(row.head_user_id) : null,
              String(row.name ?? (dto.name as string) ?? ''),
            ),
          );
        }
      }

      return createdR;
    });
  }

  /**
   * T10-04 — Excel/bulk import of org nodes (kartalar). Row-by-row validation
   * with an error-list + PARTIAL COMMIT: every valid row is created (reusing the
   * canonical `create` flow → same cascade/level-derivation), every invalid row
   * is reported in `errors[]` with its 1-based row number and reason. A single
   * bad row never aborts the whole import.
   *
   * Validation (STRUKTURA — no fabricated data, Q-40):
   *   - name: required, non-empty (org_departments.name is NOT NULL)
   *   - parentId: if supplied, the referenced node must already exist
   *   - otdeleniyeNo: if supplied, must be 1..7 (DB CHECK chk_otdeleniye_no_range)
   * Rows are processed in order so a parent created earlier in the same batch can
   * be referenced by a later row only if its DB id is supplied (Excel carries ids).
   */
  async importNodes(rows: Record<string, unknown>[]) {
    return safeCall(async () => {
      const list = Array.isArray(rows) ? rows : [];
      const errors: { row: number; field?: string; message: string }[] = [];
      const created: { row: number; id: number; name: string }[] = [];
      let imported = 0;

      for (let i = 0; i < list.length; i++) {
        const rowNo = i + 1; // 1-based for human-facing report
        const dto = (list[i] ?? {}) as Record<string, unknown>;

        // --- name (required) ---
        const name = typeof dto.name === 'string' ? dto.name.trim() : '';
        if (!name) {
          errors.push({ row: rowNo, field: 'name', message: 'Nom (name) bo\'sh bo\'lishi mumkin emas' });
          continue;
        }

        // --- parentId existence (when supplied) ---
        if (dto.parentId !== undefined && dto.parentId !== null && dto.parentId !== '') {
          const parentId = Number(dto.parentId);
          if (!Number.isFinite(parentId) || parentId <= 0) {
            errors.push({ row: rowNo, field: 'parentId', message: `parentId noto'g'ri: ${String(dto.parentId)}` });
            continue;
          }
          const existsR = await this.repo.existsById(parentId);
          if (!existsR.ok || !existsR.data) {
            errors.push({ row: rowNo, field: 'parentId', message: `Ota karta topilmadi: #${parentId}` });
            continue;
          }
        }

        // --- otdeleniyeNo range (when supplied) — mirrors DB CHECK 1..7 ---
        if (dto.otdeleniyeNo !== undefined && dto.otdeleniyeNo !== null && dto.otdeleniyeNo !== '') {
          const ono = Number(dto.otdeleniyeNo);
          if (!Number.isInteger(ono) || ono < 1 || ono > 7) {
            errors.push({ row: rowNo, field: 'otdeleniyeNo', message: `otdeleniyeNo 1..7 oralig'ida bo'lishi kerak: ${String(dto.otdeleniyeNo)}` });
            continue;
          }
        }

        // --- partial commit: create via the canonical flow (cascade + level) ---
        const createR = await this.create({ ...dto, name });
        if (!createR.ok) {
          errors.push({ row: rowNo, message: createR.error.message });
          continue;
        }
        const createdRow = createR.data as Record<string, unknown>;
        const newId = Number(createdRow?.id);
        imported++;
        created.push({ row: rowNo, id: Number.isFinite(newId) ? newId : 0, name });
      }

      return {
        imported,
        failed: errors.length,
        total: list.length,
        created,
        errors,
      };
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    this.logger.log(`org structure: yangilanmoqda`);
    const existsR = await this.repo.existsById(id);
    if (!existsR.ok || !existsR.data) return Err(`Node #${id} topilmadi`);

    return this.repo.updateFromDto(id, dto);
  }

  async remove(id: number) {
    this.logger.log(`org structure: o'chirilmoqda`);
    const existsR = await this.repo.existsById(id);
    if (!existsR.ok || !existsR.data) return Err(`Node #${id} topilmadi`);
    await this.repo.deactivate(id);
    return Ok({ message: `Node #${id} o'chirildi` });
  }

  async move(id: number, newParentId: number | null) {
    // ─── Defensive cycle check ────────────────────────────────────────────
    // Phase 1 T1.3 (cycle-detector.service) is the canonical implementation.
    // Until that lands, this inline check prevents the two trivial cycles
    // that would break the tree:
    //   (a) self-parent: moving a node under itself.
    //   (b) ancestor-cycle: moving a node under one of its own descendants.
    // The check walks newParentId's ancestors via `getHierarchyNodes()` (single
    // O(n) fetch + O(depth) traversal) — small relative to a write.
    if (newParentId !== null && newParentId !== undefined) {
      if (Number(newParentId) === Number(id)) {
        return Err('Tugun o\'zini ota qila olmaydi (self-cycle)');
      }
      const nodesR = await this.repo.getHierarchyNodes();
      if (nodesR.ok) {
        const parentByChild = new Map<number, number | null>();
        const rows = Array.isArray(nodesR.data) ? nodesR.data : [];
        for (const row of rows) {
          const n = row as Record<string, unknown>;
          const nid = Number(n['id']);
          const rawParent = n['parentId'] ?? n['parent_id'];
          const pid = rawParent === null || rawParent === undefined
            ? null
            : Number(rawParent);
          if (Number.isFinite(nid)) parentByChild.set(nid, pid);
        }
        // Walk up from newParentId — if we hit `id` it would create a cycle.
        let cursor: number | null = Number(newParentId);
        const visited = new Set<number>();
        while (cursor !== null && cursor !== undefined) {
          if (visited.has(cursor)) break; // existing cycle — bail out
          visited.add(cursor);
          if (cursor === Number(id)) {
            return Err('Bu ko\'chirish tsiklik bog\'lanish hosil qiladi');
          }
          cursor = parentByChild.get(cursor) ?? null;
        }
      }
    }

    let level = 0;
    if (newParentId) {
      const levelR = await this.repo.getParentLevel(newParentId);
      level = levelR.ok ? (levelR.data as number) : 0;
    }
    return this.repo.move(id, newParentId, level);
  }

  /**
   * Returns all active users for the FE department-head picker.
   * 87% of org nodes have zero members → member-based list leaves headOptions=[].
   * This endpoint surfaces every active user so the head can always be selected.
   */
  async getAvailableUsers() {
    return safeCall(async () => {
      const r = await this.repo.availableUsers();
      const rows = r.ok && Array.isArray(r.data) ? r.data : [];
      return {
        users: rows.map((u) => ({
          id: u.id,
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        })),
      };
    });
  }

  async assignUserToNode(userId: number, nodeId: number, stakeFraction: number | null = null, allowOverload = false) {
    return safeCall(async () => {
      const r = await this.repo.assignUser(userId, nodeId, stakeFraction, allowOverload);
      return r.assigned
        ? { assigned: true, message: 'Xodim kartaga biriktirildi' }
        : { assigned: false, message: r.reason ?? "Biriktirib bo'lmadi" };
    });
  }

  async removeUserFromNode(userId: number, nodeId: number) {
    return safeCall(async () => {
      await this.repo.removeUser(userId, nodeId);
      return { removed: true, message: 'Xodim kartadan olib tashlandi' };
    });
  }

  async getApprovalChain(nodeId: number) {
    return safeCall(async () => {
      const r = await this.repo.getApprovalChain(nodeId);
      return { chain: r.ok ? r.data : [] };
    });
  }

  async getDirectManager(nodeId: number) {
    return safeCall(async () => {
      const r = await this.repo.getDirectManager(nodeId);
      return { manager: r.ok ? r.data : null };
    });
  }

  async getTelegramGroupForNode(nodeId: number) {
    return safeCall(async () => {
      const r = await this.repo.getTelegramGroupForNode(nodeId);
      return { telegramGroup: r.ok ? r.data : null };
    });
  }

  /**
   * P51 — Derives the direct manager of a node by walking the parent chain
   * (vizyon §2.3 Q1/Q4: head of the immediately-higher node). Returns a null
   * manager when no non-null head exists up the chain — NOT fabricated (Q-40).
   */
  async deriveManagerForNode(nodeId: number) {
    return safeCall(async () => {
      const r = await this.repo.deriveManagerForNode(nodeId);
      return {
        derivedManager: r.ok
          ? r.data
          : { managerUserId: null, managerName: null, resolvedAtNodeId: null, resolvedAtNodeName: null, depth: 0 },
      };
    });
  }

  /**
   * P51 — Admin operation: recomputes org_functions.manager_id and
   * employees.manager_id from the org tree. DATA-gated — if any active node
   * still has a NULL head_user_id, the backfill is refused (dataGateOpen=false)
   * and nothing is written. dryRun (default true) previews the row counts only.
   */
  async triggerManagerBackfill(dryRun: boolean) {
    return safeCall(async () => {
      const r = await this.repo.backfillManagerIds(dryRun);
      if (!r.ok) {
        return {
          nullHeadCount: -1,
          dataGateOpen: false,
          updatedFunctions: 0,
          updatedEmployees: 0,
          message: r.error.message,
        };
      }
      this.logger.log(
        `manager backfill: dryRun=${dryRun}, dataGateOpen=${r.data.dataGateOpen}, ` +
        `functions=${r.data.updatedFunctions}, employees=${r.data.updatedEmployees}`,
      );
      return r.data;
    });
  }
}
