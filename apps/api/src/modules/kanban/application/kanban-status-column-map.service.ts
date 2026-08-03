/**
 * @module kanban-status-column-map.service
 * @description Thin application-layer pass-through to
 *   `KanbanStatusColumnMapRepository` (Qoida 15 — controllers/services never
 *   touch `db.*` directly). No business logic beyond delegation: validation
 *   lives in the Zod DTO schemas, referential integrity lives in the DB
 *   (FK on kanban_column_id, UNIQUE on sd_status).
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  KanbanStatusColumnMapRepository,
  StatusColumnMappingRow,
  KanbanColumnOptionRow,
  CreateStatusColumnMapInput,
  UpdateStatusColumnMapInput,
} from '../infrastructure/repositories/kanban-status-column-map.repo';

@Injectable()
export class KanbanStatusColumnMapService {
  constructor(private readonly repo: KanbanStatusColumnMapRepository) {}

  list(): Promise<Result<StatusColumnMappingRow[]>> {
    return this.repo.listMappings();
  }

  listColumns(): Promise<Result<KanbanColumnOptionRow[]>> {
    return this.repo.listColumns();
  }

  create(input: CreateStatusColumnMapInput): Promise<Result<StatusColumnMappingRow>> {
    return this.repo.createMapping(input);
  }

  update(id: number, input: UpdateStatusColumnMapInput): Promise<Result<StatusColumnMappingRow>> {
    return this.repo.updateMapping(id, input);
  }

  remove(id: number): Promise<Result<void>> {
    return this.repo.deleteMapping(id);
  }
}
