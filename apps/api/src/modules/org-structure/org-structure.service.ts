/**
 * @module org-structure.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { OrgStructureRepository } from './org-structure.repository';

const ORG_DEFAULT_PAGE_LIMIT = 50;

@Injectable()
export class OrgStructureService {
  private readonly logger = new Logger(OrgStructureService.name);

  constructor(private readonly repo: OrgStructureRepository) {}

  async getHierarchy(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const nodes = await this.repo.getHierarchyNodes();
      if (!nodes.ok) throw new Error(nodes.error.message);
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

      return { nodes: roots };
    });
  }

  async getStats() {
    return safeCall(async () => {
      const s = await this.repo.getStats();
      if (!s.ok) throw new Error(s.error.message);
      const totalCapacity = parseInt(String(s.data.totalCapacity)) || 0;
      const totalEmployees = parseInt(String(s.data.totalEmployees)) || 0;
      const vacantCount = Math.max(0, totalCapacity - totalEmployees);
      return {
        totalNodes: s.data.totalNodes || 0,
        totalDepartments: s.data.totalDepartments || 0,
        totalEmployees,
        vacantCount,
        vacantPercent: totalCapacity > 0 ? Math.round((vacantCount / totalCapacity) * 100) : 0,
        recentChanges: s.data.recentChanges || 0,
      };
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
    return safeCall(async () => {
      this.logger.log(`org structure: yangilanmoqda`);
      const existsR = await this.repo.existsById(id);
      if (!existsR.ok || !existsR.data) throw new Error(`Node #${id} topilmadi`);

      return this.repo.updateFromDto(id, dto);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      this.logger.log(`org structure: o'chirilmoqda`);
      const existsR = await this.repo.existsById(id);
      if (!existsR.ok || !existsR.data) throw new Error(`Node #${id} topilmadi`);
      await this.repo.deactivate(id);
      return { message: `Node #${id} o'chirildi` };
    });
  }

  async move(id: number, newParentId: number | null) {
    return safeCall(async () => {
      let level = 0;
      if (newParentId) {
        const levelR = await this.repo.getParentLevel(newParentId);
        level = levelR.ok ? (levelR.data as number) : 0;
      }
      return this.repo.move(id, newParentId, level);
    });
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
