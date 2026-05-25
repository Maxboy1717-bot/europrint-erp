/**
 * @module workflow-route-acl
 * @description ACL translator: legacy `document_workflow_routes` rows (from
 * `document-workflow-v2.service.ts:listRoutes`) ↔ canonical
 * `WorkflowRouteDto` consumed by new BC-3 (HR / People — Document
 * Workflow) code.
 *
 * The legacy raw SQL aliases columns to camelCase via SQL `AS` but emits
 * the JSON `vertical_steps`/`horizontal_steps` columns as `unknown`. The
 * translator narrows the row to typed fields and defends against
 * malformed JSON arrays.
 *
 * TODO PA2-14: drop once a typed `DocumentWorkflowRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyWorkflowRouteRow {
  id: string | number;
  documentType?: unknown;
  name?: unknown;
  nameRu?: unknown;
  verticalSteps?: unknown;
  horizontalSteps?: unknown;
  approvalTimeoutHours?: unknown;
  isActive?: unknown;
}

export interface WorkflowRouteDto {
  id: string;
  documentType: string;
  name: string;
  nameRu: string | null;
  verticalSteps: unknown[];
  horizontalSteps: unknown[];
  approvalTimeoutHours: number | null;
  isActive: boolean;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toArr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === 't' || v === '1';
  if (typeof v === 'number') return v !== 0;
  return false;
}

export class WorkflowRouteAclTranslator
  implements IAclTranslator<LegacyWorkflowRouteRow, WorkflowRouteDto>
{
  toDomain(legacy: LegacyWorkflowRouteRow): Result<WorkflowRouteDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'WorkflowRouteAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'WorkflowRouteAcl: legacy.id missing'));
    }
    const documentType = toStr(legacy.documentType);
    if (!documentType) {
      return Err(AppErr('VALIDATION', 'WorkflowRouteAcl: documentType missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'WorkflowRouteAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      documentType,
      name,
      nameRu: toStr(legacy.nameRu),
      verticalSteps: toArr(legacy.verticalSteps),
      horizontalSteps: toArr(legacy.horizontalSteps),
      approvalTimeoutHours: toNumOrNull(legacy.approvalTimeoutHours),
      isActive: toBool(legacy.isActive),
    });
  }

  toLegacy(domain: WorkflowRouteDto): LegacyWorkflowRouteRow {
    return {
      id: domain.id,
      documentType: domain.documentType,
      name: domain.name,
      nameRu: domain.nameRu,
      verticalSteps: domain.verticalSteps,
      horizontalSteps: domain.horizontalSteps,
      approvalTimeoutHours: domain.approvalTimeoutHours,
      isActive: domain.isActive,
    };
  }
}
