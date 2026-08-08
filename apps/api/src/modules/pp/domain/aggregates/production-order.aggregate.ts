/**
 * @module production-order.aggregate
 * @description Source module. See exports for details.
 */

import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Err } from '@common/result';
import { Result } from '@common/result';
import type { IOrderHeader, OrderKind } from '@shared/domain/contracts/i-order-header';

/**
 * Production-order lifecycle (EP-PP-082 / EP-PP-118 owner override).
 *
 * Owner vision = 7 forward statuses + 2 terminal/interrupt statuses:
 *   Reja → Tasdiqlangan → Ishga tushgan → Jarayonda → Sifatda → Tugadi → Yopildi
 *   (+ Bekor / To'xtatilgan)
 *
 * The 5 PRE-EXISTING enum members are kept verbatim as a SUBSET so nothing that
 * already persisted/transitioned breaks (Q-46 — extend, do not break). The owner
 * 9-status vision maps onto them as follows:
 *
 *   Vision (UZ)      | enum member                | persisted string         | new?
 *   -----------------|----------------------------|--------------------------|-----
 *   Reja             | PLANNED                    | 'planned'                | existing
 *   Tasdiqlangan     | CONFIRMED                  | 'confirmed'              | NEW
 *   Ishga tushgan    | RELEASED_TO_PRODUCTION     | 'released_to_production' | existing
 *   Jarayonda        | IN_PROGRESS                | 'in_progress'            | existing
 *   Sifatda          | IN_QC                      | 'in_qc'                  | NEW
 *   Tugadi           | COMPLETED                  | 'completed'              | existing
 *   Yopildi          | CLOSED                     | 'closed'                 | NEW
 *   Bekor            | CANCELLED                  | 'cancelled'              | existing
 *   To'xtatilgan     | PAUSED                     | 'paused'                 | NEW
 *
 * The original happy path (PLANNED → RELEASED_TO_PRODUCTION → IN_PROGRESS →
 * COMPLETED) is preserved exactly; CONFIRMED, IN_QC and CLOSED are inserted as
 * OPTIONAL intermediate steps (you may still skip straight through the old path).
 */
export enum PoStatus {
  PLANNED = 'planned',
  CONFIRMED = 'confirmed',
  RELEASED_TO_PRODUCTION = 'released_to_production',
  IN_PROGRESS = 'in_progress',
  IN_QC = 'in_qc',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

/**
 * Allowed forward/interrupt transitions per status. A transition is legal iff the
 * target appears in the source's list. CANCELLED is reachable from every
 * non-terminal status; PAUSED is reachable from the active states and resumes
 * back to where work continues. CLOSED is the only true terminal status.
 *
 * Pure data — kept here so both the aggregate and any planner can reason about it.
 */
export const PO_STATUS_TRANSITIONS: Readonly<Record<PoStatus, readonly PoStatus[]>> = {
  [PoStatus.PLANNED]: [PoStatus.CONFIRMED, PoStatus.RELEASED_TO_PRODUCTION, PoStatus.CANCELLED],
  [PoStatus.CONFIRMED]: [PoStatus.RELEASED_TO_PRODUCTION, PoStatus.PAUSED, PoStatus.CANCELLED],
  [PoStatus.RELEASED_TO_PRODUCTION]: [PoStatus.IN_PROGRESS, PoStatus.PAUSED, PoStatus.CANCELLED],
  [PoStatus.IN_PROGRESS]: [PoStatus.IN_QC, PoStatus.COMPLETED, PoStatus.PAUSED, PoStatus.CANCELLED],
  [PoStatus.IN_QC]: [PoStatus.COMPLETED, PoStatus.IN_PROGRESS, PoStatus.PAUSED, PoStatus.CANCELLED],
  [PoStatus.COMPLETED]: [PoStatus.CLOSED],
  [PoStatus.PAUSED]: [PoStatus.IN_PROGRESS, PoStatus.RELEASED_TO_PRODUCTION, PoStatus.CANCELLED],
  [PoStatus.CLOSED]: [],
  [PoStatus.CANCELLED]: [],
};

/** True when `to` is a legal next status from `from` (EP-PP-082 lifecycle). */
export function canTransition(from: PoStatus, to: PoStatus): boolean {
  const allowed = PO_STATUS_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

export class MaterialRequirement {
  constructor(public materialId: number,
    public quantity: number,
    public reserved: number = 0,
    public issued: number = 0) {}
}

export class ProductionOrder extends AggregateRoot implements IOrderHeader {
  private _id: number;
  private _soId: number;
  private _status: PoStatus;
  private _bomId: number;
  private _routingId: number;
  private _plannedStart: Date;
  private _plannedEnd: Date;
  private _productId: number = 0; // finished-good id (NOT NULL in production_orders); set from the BOM
  private _materialList: MaterialRequirement[] = [];
  private _checkpointValidated: boolean = false;
  // SB0233 (06-PP audit): karta-markazli ERP-ORG — buyurtma qaysi org-karta
  // (sex/bo'lim, org_departments.id)ga tegishli ekani. NULL = hali tayinlanmagan
  // (egasi-DATA: avtomatik karta-tayinlash qoidasi hozircha yo'q, Q-40).
  private _orgDepartmentId: number | null = null;
  // NOTE PA2-16: orderNumber / createdAt / updatedAt / createdBy are placeholder
  // header fields added to satisfy the cross-context IOrderHeader contract. The
  // PP context does not yet meaningfully track them — they default to empty /
  // current time / null until the persistence model grows real columns. Do not
  // use these for business logic; rely on getSoId() / getStatus() / events.
  private _orderNumber: string = '';
  private _createdAt: Date = new Date();
  private _updatedAt: Date | null = null;
  private _createdBy: number | null = null;

  constructor(
    id: number,
    soId: number,
    bomId: number,
    routingId: number,
    plannedStart: Date,
    plannedEnd: Date,
  ) {
    super();
    this._id = id;
    this._soId = soId;
    this._bomId = bomId;
    this._routingId = routingId;
    this._plannedStart = plannedStart;
    this._plannedEnd = plannedEnd;
    this._status = PoStatus.PLANNED;
  }

  getId(): number { return this._id; }
  getStatus(): PoStatus { return this._status; }
  getSoId(): number { return this._soId; }
  getBomId(): number { return this._bomId; }
  getRoutingId(): number { return this._routingId; }
  getProductId(): number { return this._productId; }
  setProductId(productId: number): void { this._productId = productId; }
  getOrgDepartmentId(): number | null { return this._orgDepartmentId; }
  setOrgDepartmentId(orgDepartmentId: number | null): void { this._orgDepartmentId = orgDepartmentId; }
  getPlannedStart(): Date { return this._plannedStart; }
  getPlannedEnd(): Date { return this._plannedEnd; }

  getMaterialList(): MaterialRequirement[] {
    return this._materialList;
  }

  setCheckpointValidated(validated: boolean): void {
    this._checkpointValidated = validated;
  }

  addMaterialRequirement(material: MaterialRequirement): Result<void> {
    const exists = this._materialList.find((m) => m.materialId === material.materialId);
    if (exists) {
      // C.23: error CODES only — translation lives in the presentation layer.
      return Err('MATERIAL_ALREADY_ADDED');
    }
    this._materialList.push(material);
    return { ok: true, data: undefined };
  }

  release(): Result<void> {
    if (!this._checkpointValidated) {
      return Err('CHECKPOINT_REQUIRED');
    }
    if (this._status !== PoStatus.PLANNED) {
      return Err('INVALID_STATUS_FOR_RELEASE');
    }
    this._status = PoStatus.RELEASED_TO_PRODUCTION;
    this.addDomainEvent({ type: 'PP_RELEASED_TO_PRODUCTION', data: { poId: this._id } });
    return { ok: true, data: undefined };
  }

  startProduction(): Result<void> {
    if (this._status !== PoStatus.RELEASED_TO_PRODUCTION) {
      return Err('NOT_RELEASED');
    }
    this._status = PoStatus.IN_PROGRESS;
    this.addDomainEvent({ type: 'PP_STARTED', data: { poId: this._id } });
    return { ok: true, data: undefined };
  }

  complete(): Result<void> {
    // Sifatda (IN_QC) is an OPTIONAL gate before Tugadi (COMPLETED). The original
    // path completed straight from IN_PROGRESS; both remain valid (Q-46).
    if (this._status !== PoStatus.IN_PROGRESS && this._status !== PoStatus.IN_QC) {
      return Err('NOT_IN_PROGRESS');
    }
    this._status = PoStatus.COMPLETED;
    this.addDomainEvent({ type: 'PP_COMPLETED', data: { poId: this._id } });
    return { ok: true, data: undefined };
  }

  // ── New EP-PP-082 lifecycle steps (additive; old path above untouched) ──

  /** Reja → Tasdiqlangan (EP-PP-082). Optional approval step before release. */
  confirm(): Result<void> {
    return this.transitionTo(PoStatus.CONFIRMED, 'PP_CONFIRMED');
  }

  /** Jarayonda → Sifatda (EP-PP-082). Send the order to QC before completion. */
  sendToQc(): Result<void> {
    return this.transitionTo(PoStatus.IN_QC, 'PP_SENT_TO_QC');
  }

  /** Tugadi → Yopildi (EP-PP-082). Terminal close after completion. */
  close(): Result<void> {
    return this.transitionTo(PoStatus.CLOSED, 'PP_CLOSED');
  }

  /** active → To'xtatilgan (EP-PP-082 / EP-PP-083). Interrupt; WIP preserved. */
  pause(): Result<void> {
    return this.transitionTo(PoStatus.PAUSED, 'PP_PAUSED');
  }

  /** To'xtatilgan → resume work (EP-PP-082). Returns to IN_PROGRESS. */
  resume(): Result<void> {
    return this.transitionTo(PoStatus.IN_PROGRESS, 'PP_RESUMED');
  }

  /** any non-terminal → Bekor (EP-PP-082 / EP-PP-083). */
  cancel(): Result<void> {
    return this.transitionTo(PoStatus.CANCELLED, 'PP_CANCELLED');
  }

  /**
   * Generic, table-driven status change. Validates against PO_STATUS_TRANSITIONS
   * and returns Err('INVALID_TRANSITION') for any illegal hop. This is the single
   * choke-point the new steps go through; the legacy release/start/complete methods
   * keep their original bespoke guards for byte-for-byte behaviour compatibility.
   */
  transitionTo(target: PoStatus, eventType?: string): Result<void> {
    if (!canTransition(this._status, target)) {
      return Err('INVALID_TRANSITION');
    }
    this._status = target;
    if (eventType) {
      this.addDomainEvent({ type: eventType, data: { poId: this._id, status: target } });
    }
    return { ok: true, data: undefined };
  }

  // --- IOrderHeader marker (cross-context "an order" shape) ---
  get id(): number { return this._id; }
  get orderNumber(): string { return this._orderNumber; }
  get status(): string { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date | null { return this._updatedAt; }
  get createdBy(): number | null { return this._createdBy; }
  /**
   * Bounded-context discriminator for cross-context order code.
   */
  get kind(): OrderKind { return 'production'; }
}
