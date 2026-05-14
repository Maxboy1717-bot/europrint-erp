/**
 * @module production-session.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@nestjs/cqrs';
import { Err } from '@common/result';
import { Result } from '@common/result';

export enum MesStatus {
  READY = 'ready',
  CHECKLIST_PENDING = 'checklist_pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  SENT_TO_QC = 'sent_to_qc',
}

export class Downtime {
  constructor(public reason: string, public duration: number, public timestamp: Date = _time.now()) {}
}

export class ProductionSession extends AggregateRoot {
  private id: number;
  private ppId: number;
  private workCenterId: number;
  private operatorId: number;
  private status: MesStatus;
  private certificationRequired: boolean;
  private startedAt: Date | null = null;
  private completedAt: Date | null = null;
  private downtimes: Downtime[] = [];
  private totalDowntimeDuration: number = 0;

  constructor(
    id: number,
    ppId: number,
    workCenterId: number,
    operatorId: number,
    certificationRequired: boolean,
  ) {
    super();
    this.id = id;
    this.ppId = ppId;
    this.workCenterId = workCenterId;
    this.operatorId = operatorId;
    this.certificationRequired = certificationRequired;
    this.status = MesStatus.READY;
  }

  getId(): number {
    return this.id;
  }

  getStatus(): MesStatus {
    return this.status;
  }

  getCertificationRequired(): boolean {
    return this.certificationRequired;
  }

  getOperatorId(): number {
    return this.operatorId;
  }

  getDowntimes(): Downtime[] {
    return this.downtimes;
  }

  start(): Result<void> {
    if (this.status !== MesStatus.CHECKLIST_PENDING) {
      return Err('Faqat tekshiruv olingan sessiyani boshlash mumkin');
    }
    this.status = MesStatus.RUNNING;
    this.startedAt = _time.now();
    this.apply({ type: 'MES_SESSION_STARTED', data: { sessionId: this.id } });
    return { ok: true, data: undefined };
  }

  pause(reason: string): Result<void> {
    if (this.status !== MesStatus.RUNNING) {
      return Err('Faqat ishchi sessiyani to\'xtatish mumkin');
    }
    this.status = MesStatus.PAUSED;
    this.apply({
      type: 'MES_SESSION_PAUSED',
      data: { sessionId: this.id, reason },
    });
    return { ok: true, data: undefined };
  }

  complete(): Result<void> {
    if (this.status !== MesStatus.RUNNING && this.status !== MesStatus.PAUSED) {
      return Err('Sessiya ish jarayonida emas');
    }
    this.status = MesStatus.COMPLETED;
    this.completedAt = _time.now();
    this.apply({ type: 'MES_COMPLETED', data: { sessionId: this.id } });
    this.apply({
      type: 'MES_TO_HR_360',
      data: { sessionId: this.id, operatorId: this.operatorId },
    });
    return { ok: true, data: undefined };
  }

  recordDowntime(reason: string, duration: number): Result<void> {
    if (!reason || reason.trim().length === 0) {
      return Err('Sabab majburiy');
    }
    if (duration <= 0) {
      return Err('Davomiyligi 0 dan katta bo\'lishi kerak');
    }
    const downtime = new Downtime(reason, duration);
    this.downtimes.push(downtime);
    this.totalDowntimeDuration += duration;
    this.apply({
      type: 'DOWNTIME_RECORDED',
      data: { sessionId: this.id, reason, duration },
    });
    return { ok: true, data: undefined };
  }

  getTotalDowntime(): number {
    return this.totalDowntimeDuration;
  }

  moveToQc(): Result<void> {
    if (this.status !== MesStatus.COMPLETED) {
      return Err('Faqat tugallangan sessiyani QC ga yuborish mumkin');
    }
    this.status = MesStatus.SENT_TO_QC;
    this.apply({ type: 'MES_SENT_TO_QC', data: { sessionId: this.id } });
    return { ok: true, data: undefined };
  }

  passChecklist(): Result<void> {
    if (this.status !== MesStatus.READY) {
      return Err('Faqat tayyor sessiyani tekshiruv qilish mumkin');
    }
    this.status = MesStatus.CHECKLIST_PENDING;
    return { ok: true, data: undefined };
  }
}
