/**
 * @module org-structure/cascade/org-cascade.listener
 * @description EP-ORG-041 (ORG-CASCADE) — owner decision #13. When a new
 *   org_departments node of a warehouse-bearing type is created, AUTO-create a
 *   corresponding warehouse (existing `warehouses` table) and grant the node
 *   head the warehouse RBAC role (existing `users.role`). Event-driven via
 *   EventEmitter2 (@OnEvent), fired AFTER the create commit.
 *
 * Idempotent: if a warehouse for the node already exists, the whole cascade is
 *   skipped. Head missing → warehouse still created, RBAC grant skipped + noted
 *   (Q-40: never fabricate a head/role).
 *
 * The handler delegates all DB access to OrgCascadeRepository so it stays unit
 * testable with a mock repo (TEST_STANDARTLARI domain-logic exception). It never
 * throws — failures are logged and swallowed so a cascade error cannot roll back
 * the already-committed department.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Result, Ok, Err } from '@common/result';
import { OrgCascadeRepository } from './org-cascade.repository';
import { DepartmentCreatedEvent } from './department-created.event';
import {
  ORG_CASCADE_EVENT,
  WAREHOUSE_HEAD_ROLE,
  isWarehouseBearingType,
} from './org-cascade.constants';

export interface OrgCascadeOutcome {
  /** True when the node type is warehouse-bearing and was processed. */
  applied: boolean;
  /** True when a NEW warehouse row was inserted (false = already existed). */
  warehouseCreated: boolean;
  /** id of the node's warehouse (new or pre-existing), or null when skipped. */
  warehouseId: number | null;
  /** True when the head's role was written this run. */
  roleGranted: boolean;
  /** Human-readable trail (op-code EP-ORG-041 — LOYIHA-BITGAN §B). */
  note: string;
}

@Injectable()
export class OrgCascadeListener {
  private readonly logger = new Logger(OrgCascadeListener.name);

  constructor(private readonly repo: OrgCascadeRepository) {}

  /**
   * EventEmitter2 entrypoint. Wraps the pure handler so a cascade failure is
   * logged but never propagates (the department is already committed).
   */
  @OnEvent(ORG_CASCADE_EVENT)
  async onDepartmentCreated(event: DepartmentCreatedEvent): Promise<void> {
    const result = await this.handle(event);
    if (result.ok) {
      this.logger.log(`EP-ORG-041 cascade: ${result.data.note}`);
    } else {
      // Swallow — do not let a cascade error break the committed create.
      this.logger.error(`EP-ORG-041 cascade xatolik: ${result.error.message}`);
    }
  }

  /**
   * Pure cascade logic — returns a Result so it is fully unit-testable.
   *  1. Non-warehouse type → no-op.
   *  2. Warehouse already exists for node → idempotent skip.
   *  3. Create warehouse (existing table). Head present → grant RBAC role;
   *     head missing → warehouse created, RBAC skipped + noted.
   */
  async handle(event: DepartmentCreatedEvent): Promise<Result<OrgCascadeOutcome>> {
    if (!isWarehouseBearingType(event.nodeType)) {
      return Ok({
        applied: false,
        warehouseCreated: false,
        warehouseId: null,
        roleGranted: false,
        note: `node #${event.nodeId} turi '${event.nodeType}' ombor-tashuvchi emas — o'tkazib yuborildi`,
      });
    }

    // Idempotency gate — one warehouse per node (keyed on deterministic code).
    const existingR = await this.repo.findWarehouseByNode(event.nodeId);
    if (!existingR.ok) return Err(existingR.error.message);
    if (existingR.data) {
      return Ok({
        applied: true,
        warehouseCreated: false,
        warehouseId: existingR.data,
        roleGranted: false,
        note: `node #${event.nodeId} ombori allaqachon mavjud (#${existingR.data}) — o'tkazib yuborildi`,
      });
    }

    // Create the warehouse in the EXISTING warehouses table (real INSERT).
    const whR = await this.repo.createWarehouseForNode({
      nodeId: event.nodeId,
      name: event.name,
      headUserId: event.headUserId,
    });
    if (!whR.ok) return Err(whR.error.message);
    const rawId = (whR.data as { id?: unknown }).id;
    const warehouseId = rawId != null && Number.isFinite(Number(rawId)) ? Number(rawId) : null;

    // Grant RBAC role to the node head — only when a head is assigned (Q-40).
    if (event.headUserId === null || event.headUserId === undefined) {
      return Ok({
        applied: true,
        warehouseCreated: true,
        warehouseId,
        roleGranted: false,
        note: `node #${event.nodeId} ombori yaratildi (#${warehouseId}); rahbar tayinlanmagan — RBAC o'tkazib yuborildi`,
      });
    }

    const grantR = await this.repo.grantRoleToUser(event.headUserId, WAREHOUSE_HEAD_ROLE);
    if (!grantR.ok) {
      // Warehouse already created — report it; surface the grant failure.
      return Err(
        `node #${event.nodeId} ombori yaratildi (#${warehouseId}) lekin RBAC xato: ${grantR.error.message}`,
      );
    }

    return Ok({
      applied: true,
      warehouseCreated: true,
      warehouseId,
      roleGranted: grantR.data,
      note: grantR.data
        ? `node #${event.nodeId} ombori yaratildi (#${warehouseId}); rahbar #${event.headUserId} '${WAREHOUSE_HEAD_ROLE}' roli berildi`
        : `node #${event.nodeId} ombori yaratildi (#${warehouseId}); rahbar #${event.headUserId} roli o'zgartirilmadi (himoyalangan/mavjud)`,
    });
  }
}
