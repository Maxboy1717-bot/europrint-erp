/**
 * @module org-structure.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { backfillEmployeeUserId } from '@common/database/ddl-migrations';
import { OrgStructureRepository } from './org-structure.repository';

const ORG_DEFAULT_PAGE_LIMIT = 50;

@Injectable()
export class OrgStructureService implements OnModuleInit {
  private readonly logger = new Logger(OrgStructureService.name);

  constructor(private readonly repo: OrgStructureRepository) {}

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
      const cap = parseInt(String(n.capacity)) || 0;
      const emp = Number(n.employeeCount) || 0;
      nodeMap.set(Number(n.id), { ...n, children: [], employees: [], vacantCount: Math.max(0, cap - emp) });
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
    const totalCapacity = parseInt(String(s.data.totalCapacity)) || 0;
    const totalEmployees = parseInt(String(s.data.totalEmployees)) || 0;
    const vacantCount = Math.max(0, totalCapacity - totalEmployees);
    return Ok({
      totalNodes: s.data.totalNodes || 0,
      totalDepartments: s.data.totalDepartments || 0,
      totalEmployees,
      vacantCount,
      vacantPercent: totalCapacity > 0 ? Math.round((vacantCount / totalCapacity) * 100) : 0,
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
      return this.repo.create(dto, level);
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

  async assignUserToNode(userId: number, nodeId: number) {
    return safeCall(async () => {
      await this.repo.assignUser(userId, nodeId);
      return { message: "Xodim bo'limga biriktirildi" };
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
}
