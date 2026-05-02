import { Result } from '@common/types/result.type';
import { Department } from '../aggregates/department.aggregate';
import { Position } from '../aggregates/position.aggregate';
import { Panel } from '../aggregates/panel.aggregate';

export interface ICoreRepo {
  findDepartmentById(id: string): Promise<Result<Department>>;
  findAllDepartments(filters?: { isActive?: boolean; parentId?: string }): Promise<Result<Department[]>>;
  saveDepartment(dept: Partial<Department>): Promise<Result<Department>>;
  updateDepartment(id: string, data: Partial<Department>): Promise<Result<Department>>;
  deleteDepartment(id: string): Promise<Result<void>>;

  findPositionById(id: string): Promise<Result<Position>>;
  findAllPositions(filters?: { departmentId?: string; isActive?: boolean }): Promise<Result<Position[]>>;
  savePosition(pos: Partial<Position>): Promise<Result<Position>>;
  updatePosition(id: string, data: Partial<Position>): Promise<Result<Position>>;
  deletePosition(id: string): Promise<Result<void>>;

  findPanelByUserId(userId: string): Promise<Result<Panel | null>>;
  savePanelForUser(userId: string, layout: Panel['layout'], name?: string): Promise<Result<Panel>>;
  updatePanelLayout(userId: string, layout: Panel['layout']): Promise<Result<Panel>>;
  getDefaultPanel(): Promise<Result<Panel | null>>;
}

export const CORE_REPO = Symbol('CORE_REPO');
