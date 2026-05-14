/**
 * @module production-order.aggregate
 * @description Source module. See exports for details.
 */

import { AggregateRoot } from '@nestjs/cqrs';
import { Err } from '@common/result';
import { Result } from '@common/result';

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

export class ProductionOrder extends AggregateRoot {
  private id: number;
  private soId: number;
  private status: PoStatus;
  private bomId: number;
  private routingId: number;
  private plannedStart: Date;
  private plannedEnd: Date;
  private materialList: MaterialRequirement[] = [];
  private checkpointValidated: boolean = false;

  constructor(
    id: number,
    soId: number,
    bomId: number,
    routingId: number,
    plannedStart: Date,
    plannedEnd: Date,
  ) {
    super();
    this.id = id;
    this.soId = soId;
    this.bomId = bomId;
    this.routingId = routingId;
    this.plannedStart = plannedStart;
    this.plannedEnd = plannedEnd;
    this.status = PoStatus.PLANNED;
  }

  getId(): number { return this.id; }
  getStatus(): PoStatus { return this.status; }
  getSoId(): number { return this.soId; }
  getBomId(): number { return this.bomId; }
  getRoutingId(): number { return this.routingId; }
  getPlannedStart(): Date { return this.plannedStart; }
  getPlannedEnd(): Date { return this.plannedEnd; }

  getMaterialList(): MaterialRequirement[] {
    return this.materialList;
  }

  setCheckpointValidated(validated: boolean): void {
    this.checkpointValidated = validated;
  }

  addMaterialRequirement(material: MaterialRequirement): Result<void> {
    const exists = this.materialList.find((m) => m.materialId === material.materialId);
    if (exists) {
      return Err('Material allaqachon qo\'shilgan');
    }
    this.materialList.push(material);
    return { ok: true, data: undefined };
  }

  release(): Result<void> {
    if (!this.checkpointValidated) {
      return Err('Uch checkpoint o\'tilishi kerak');
    }
    if (this.status !== PoStatus.PLANNED) {
      return Err(`Invalid status for release: ${this.status}`);
    }
    this.status = PoStatus.RELEASED_TO_PRODUCTION;
    this.apply({ type: 'PP_RELEASED_TO_PRODUCTION', data: { poId: this.id } });
    return { ok: true, data: undefined };
  }

  startProduction(): Result<void> {
    if (this.status !== PoStatus.RELEASED_TO_PRODUCTION) {
      return Err('PP chiqarilmagan');
    }
    this.status = PoStatus.IN_PROGRESS;
    this.apply({ type: 'PP_STARTED', data: { poId: this.id } });
    return { ok: true, data: undefined };
  }

  complete(): Result<void> {
    if (this.status !== PoStatus.IN_PROGRESS) {
      return Err('PP ish jarayonida emas');
    }
    this.status = PoStatus.COMPLETED;
    this.apply({ type: 'PP_COMPLETED', data: { poId: this.id } });
    return { ok: true, data: undefined };
  }
}
