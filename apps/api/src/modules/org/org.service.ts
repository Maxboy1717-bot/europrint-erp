import { Injectable } from '@nestjs/common';
import { OrgRepository } from './org.repository';
import type { Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class OrgService {
  constructor(private readonly repo: OrgRepository) {}

  getRazryad(): Promise<Result<Row[]>> {
    return this.repo.listRazryad();
  }

  getDepartments(): Promise<Result<Row[]>> {
    return this.repo.listDepartments();
  }

  getFunctions(departmentId?: string, status?: string): Promise<Result<Row[]>> {
    const dep = departmentId ? parseInt(departmentId, 10) : null;
    const st = status ?? null;
    return this.repo.listFunctions(dep, st);
  }

  getFunctionById(id: number): Promise<Result<Row | null>> {
    return this.repo.findFunctionById(id);
  }
}
