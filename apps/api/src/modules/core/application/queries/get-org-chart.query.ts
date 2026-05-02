import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Department } from '../../domain/aggregates/department.aggregate';
import { Position } from '../../domain/aggregates/position.aggregate';

export class GetOrgChartQuery {}

export interface OrgChartNode {
  department: Department;
  positions: Position[];
  children: OrgChartNode[];
}

@QueryHandler(GetOrgChartQuery)
export class GetOrgChartHandler implements IQueryHandler<GetOrgChartQuery> {
  private readonly logger = new Logger(GetOrgChartHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(query: GetOrgChartQuery): Promise<Result<OrgChartNode[]>> {
    const deptResult = await this.repo.findAllDepartments();
    if (!deptResult.ok) {
      return Err('Departamentlarni topishda xato');
    }

    const posResult = await this.repo.findAllPositions();
    if (!posResult.ok) {
      return Err('Lavozilarni topishda xato');
    }

    const depts = deptResult.data;
    const positions = posResult.data;

    const tree = this.buildTree(depts, positions);

    return { ok: true, data: tree };
  }

  private buildTree(departments: Department[], positions: Position[]): OrgChartNode[] {
    const departmentMap = new Map<string, OrgChartNode>();

    (departments ?? []).forEach((dept) => {
      const deptPositions = (positions ?? []).filter((p) => p.departmentId === dept.id);
      departmentMap.set(dept.id, {
        department: dept,
        positions: deptPositions,
        children: [],
      });
    });

    const roots: OrgChartNode[] = [];

    (departments ?? []).forEach((dept) => {
      const node = departmentMap.get(dept.id);
      if (!node) return;

      if (dept.parentId) {
        const parent = departmentMap.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
