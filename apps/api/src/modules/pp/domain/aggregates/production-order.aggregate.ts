/**
 * @module production-order.aggregate
 * @description Source module. See exports for details.
 */

import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Err } from '@common/result';
import { Result } from '@common/result';
import type { IOrderHeader, OrderKind } from '@shared/domain/contracts/i-order-header';

export enum PoStatus {
  PLANNED = 'planned',
  RELEASED_TO_PRODUCTION = 'released_to_production',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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
  private _materialList: MaterialRequirement[] = [];
  private _checkpointValidated: boolean = false;
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
      return Err('Material allaqachon qo\'shilgan');
    }
    this._materialList.push(material);
    return { ok: true, data: undefined };
  }

  release(): Result<void> {
    if (!this._checkpointValidated) {
      return Err('Uch checkpoint o\'tilishi kerak');
    }
    if (this._status !== PoStatus.PLANNED) {
      return Err(`Invalid status for release: ${this._status}`);
    }
    this._status = PoStatus.RELEASED_TO_PRODUCTION;
    this.addDomainEvent({ type: 'PP_RELEASED_TO_PRODUCTION', data: { poId: this._id } });
    return { ok: true, data: undefined };
  }

  startProduction(): Result<void> {
    if (this._status !== PoStatus.RELEASED_TO_PRODUCTION) {
      return Err('PP chiqarilmagan');
    }
    this._status = PoStatus.IN_PROGRESS;
    this.addDomainEvent({ type: 'PP_STARTED', data: { poId: this._id } });
    return { ok: true, data: undefined };
  }

  complete(): Result<void> {
    if (this._status !== PoStatus.IN_PROGRESS) {
      return Err('PP ish jarayonida emas');
    }
    this._status = PoStatus.COMPLETED;
    this.addDomainEvent({ type: 'PP_COMPLETED', data: { poId: this._id } });
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
