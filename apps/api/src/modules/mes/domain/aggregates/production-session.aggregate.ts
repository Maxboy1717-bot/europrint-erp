/**
 * @module production-session.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Err, AppErr } from '@common/result';
import { Result } from '@common/result';

/**
 * Snapshot of the TB-safety / smena-readiness checklist for a session, loaded by
 * the repository from the canonical `setup_checklists` + `checklist_items` tables
 * and handed to {@link ProductionSession.passChecklist}. The aggregate stays pure
 * (no DB access) — it only enforces the rule, the repo supplies the data.
 *
 * @property requiredTotal     - how many REQUIRED items exist for this session
 * @property requiredIncomplete - titles of REQUIRED items not yet completed/passed
 */
export interface ChecklistStatus {
  requiredTotal: number;
  requiredIncomplete: string[];
}

export enum MesStatus {
  READY = 'ready',
  CHECKLIST_PENDING = 'checklist_pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  SENT_TO_QC = 'sent_to_qc',
}

/**
 * Maps the persisted `production_sessions.status` vocabulary (which has DB-only
 * synonyms) onto the canonical {@link MesStatus} the aggregate enforces, so a
 * session loaded from the DB is rehydrated in its REAL stage — not a hardcoded
 * READY. Without this, every running/in_progress/paused session was rebuilt as
 * READY and `complete()` always failed with "Sessiya ish jarayonida emas",
 * breaking the golden-thread MES→QC hop for every real order (only the contrived
 * TEST session passed by state coincidence).
 *
 * Synonyms:
 *  - 'pending'      → READY (freshly-opened session, before the start gate)
 *  - 'in_progress'  → RUNNING (IoT-tablet / seed vocabulary for "running")
 *  - unknown / null → READY (fail-safe: an unrecognized status must still pass
 *                     the start gate before it can run, never silently "run")
 */
export function mapDbStatusToMesStatus(dbStatus: string | null | undefined): MesStatus {
  switch ((dbStatus ?? '').toLowerCase()) {
    case 'pending':
      return MesStatus.READY;
    case 'ready':
      return MesStatus.READY;
    case 'checklist_pending':
      return MesStatus.CHECKLIST_PENDING;
    case 'running':
    case 'in_progress':
      return MesStatus.RUNNING;
    case 'paused':
      return MesStatus.PAUSED;
    case 'completed':
      return MesStatus.COMPLETED;
    case 'sent_to_qc':
      return MesStatus.SENT_TO_QC;
    default:
      return MesStatus.READY;
  }
}

export class Downtime {
  constructor(public reason: string, public duration: number, public timestamp: Date = _time.now()) {}
}

/**
 * GSD (Genel Standart Dakika / standart-vaqt) 3-bosqich vaqt-o'lchovi. Har ishlab-chiqarish
 * sessiyasi uchun vaqt 3 ne-bir-xil bosqichga bo'linadi:
 *  - SETUP    — sozlash / changeover (ne-produktiv; OEE Availability'dan ayriladi)
 *  - MAIN     — sof ishlab-chiqarish (produktiv runTime)
 *  - TEARDOWN — tozalash / yig'ishtirish (ne-produktiv; OEE Availability'dan ayriladi)
 * DONE = barcha bosqich tugadi. advanceStage() oldingi bosqich vaqtini yig'ib keyingisiga o'tadi.
 */
export enum GsdStage {
  SETUP = 'setup',
  MAIN = 'main',
  TEARDOWN = 'teardown',
  DONE = 'done',
}

const STAGE_ORDER: GsdStage[] = [GsdStage.SETUP, GsdStage.MAIN, GsdStage.TEARDOWN, GsdStage.DONE];

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
  // GSD 3-bosqich vaqt-akkumulyatori (sekund) + joriy bosqich holati
  private setupSeconds: number = 0;
  private mainSeconds: number = 0;
  private teardownSeconds: number = 0;
  private currentStage: GsdStage | null = null;
  private stageStartedAt: Date | null = null;

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

  /**
   * Rebuilds an aggregate from a persisted row in its REAL stage — used by the
   * repository so loaded sessions reflect their DB status instead of a hardcoded
   * READY. Restores status + started/completed timestamps WITHOUT firing any
   * transition domain event (rehydration is not a state change). Enforce-on-load:
   * the staged guards (start/complete/moveToQc) then operate from the true stage,
   * so the golden-thread complete→QC hop works for every real order, not only the
   * TEST session.
   *
   * @param dbStatus    raw `production_sessions.status` (mapped via {@link mapDbStatusToMesStatus})
   * @param startedAt   persisted started_at (null when never started)
   * @param completedAt persisted ended_at (null when not finished)
   */
  static rehydrate(
    id: number,
    ppId: number,
    workCenterId: number,
    operatorId: number,
    certificationRequired: boolean,
    dbStatus: string | null | undefined,
    startedAt: Date | null = null,
    completedAt: Date | null = null,
  ): ProductionSession {
    const session = new ProductionSession(id, ppId, workCenterId, operatorId, certificationRequired);
    session.status = mapDbStatusToMesStatus(dbStatus);
    session.startedAt = startedAt;
    session.completedAt = completedAt;
    return session;
  }

  getId(): number {
    return this.id;
  }

  /** Production-plan (ishlab chiqarish-reja/buyurtma) id this session belongs to.
   *  Used to link downstream QC/golden-thread records to the real production order. */
  getPpId(): number {
    return this.ppId;
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

  getStartedAt(): Date | null {
    return this.startedAt;
  }

  getCompletedAt(): Date | null {
    return this.completedAt;
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
    this.addDomainEvent({ type: 'MES_SESSION_STARTED', data: { sessionId: this.id } });
    return { ok: true, data: undefined };
  }

  pause(reason: string): Result<void> {
    if (this.status !== MesStatus.RUNNING) {
      return Err('Faqat ishchi sessiyani to\'xtatish mumkin');
    }
    this.status = MesStatus.PAUSED;
    this.addDomainEvent({
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
    this.addDomainEvent({ type: 'MES_COMPLETED', data: { sessionId: this.id } });
    this.addDomainEvent({
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
    this.addDomainEvent({
      type: 'DOWNTIME_RECORDED',
      data: { sessionId: this.id, reason, duration },
    });
    return { ok: true, data: undefined };
  }

  getTotalDowntime(): number {
    return this.totalDowntimeDuration;
  }

  // ── GSD 3-bosqich vaqt-o'lchovi (#9) ──────────────────────────────────────────

  getCurrentStage(): GsdStage | null {
    return this.currentStage;
  }

  getSetupSeconds(): number {
    return this.setupSeconds;
  }

  getMainSeconds(): number {
    return this.mainSeconds;
  }

  getTeardownSeconds(): number {
    return this.teardownSeconds;
  }

  /** Bosqich start markeri — repo persist uchun (NULL=bosqich ichida emas). */
  getStageStartedAt(): Date | null {
    return this.stageStartedAt;
  }

  /**
   * Rehydrate uchun: persist qilingan GSD bosqich holatini aggregat'ga qaytaradi
   * (state-o'zgarish emas, shuning uchun domain-event YO'Q). Repo DB qatoridan chaqiradi.
   */
  restoreStageState(
    setupSeconds: number,
    mainSeconds: number,
    teardownSeconds: number,
    currentStage: GsdStage | null,
    stageStartedAt: Date | null,
  ): void {
    this.setupSeconds = Math.max(0, setupSeconds || 0);
    this.mainSeconds = Math.max(0, mainSeconds || 0);
    this.teardownSeconds = Math.max(0, teardownSeconds || 0);
    this.currentStage = currentStage;
    this.stageStartedAt = stageStartedAt;
  }

  /**
   * GSD birinchi bosqichni (SETUP) boshlaydi. Faqat ishchi sessiyada (RUNNING),
   * va faqat GSD hali boshlanmaganida (currentStage === null) ruxsat. stage_started_at
   * markerini qo'yadi — advanceStage() shu markerdan o'tgan vaqtni hisoblaydi.
   */
  beginStages(now: Date = _time.now()): Result<void> {
    if (this.status !== MesStatus.RUNNING) {
      return Err('GSD bosqichlarini faqat ishchi (running) sessiyada boshlash mumkin');
    }
    if (this.currentStage !== null) {
      return Err('GSD bosqichlari allaqachon boshlangan');
    }
    this.currentStage = GsdStage.SETUP;
    this.stageStartedAt = now;
    this.addDomainEvent({
      type: 'MES_STAGE_STARTED',
      data: { sessionId: this.id, stage: GsdStage.SETUP },
    });
    return { ok: true, data: undefined };
  }

  /**
   * Joriy bosqichda o'tgan vaqtni (stage_started_at..now) tegishli akkumulyatorga
   * (setup/main/teardown) qo'shadi va keyingi bosqichga o'tadi: SETUP→MAIN→TEARDOWN→DONE.
   * DONE bosqichida boshqa o'tish yo'q. Faqat RUNNING/PAUSED sessiyada.
   *
   * @param now — joriy vaqt (test-inject uchun parametr; default = Tashkent now)
   */
  advanceStage(now: Date = _time.now()): Result<void> {
    if (this.status !== MesStatus.RUNNING && this.status !== MesStatus.PAUSED) {
      return Err('GSD bosqichni faqat ishchi sessiyada o\'zgartirish mumkin');
    }
    if (this.currentStage === null) {
      return Err('GSD bosqichlari boshlanmagan — avval beginStages() chaqiring');
    }
    if (this.currentStage === GsdStage.DONE) {
      return Err('Barcha GSD bosqichlari allaqachon tugagan');
    }

    const elapsedSeconds = this.stageStartedAt
      ? Math.max(0, Math.floor((now.getTime() - this.stageStartedAt.getTime()) / 1000))
      : 0;

    switch (this.currentStage) {
      case GsdStage.SETUP:
        this.setupSeconds += elapsedSeconds;
        break;
      case GsdStage.MAIN:
        this.mainSeconds += elapsedSeconds;
        break;
      case GsdStage.TEARDOWN:
        this.teardownSeconds += elapsedSeconds;
        break;
      default:
        break;
    }

    const currentIndex = STAGE_ORDER.indexOf(this.currentStage);
    const nextStage = STAGE_ORDER[currentIndex + 1] ?? GsdStage.DONE;
    const completedStage = this.currentStage;
    this.currentStage = nextStage;
    this.stageStartedAt = nextStage === GsdStage.DONE ? null : now;

    this.addDomainEvent({
      type: 'MES_STAGE_ADVANCED',
      data: {
        sessionId: this.id,
        completedStage,
        completedSeconds: elapsedSeconds,
        nextStage,
      },
    });
    return { ok: true, data: undefined };
  }

  moveToQc(): Result<void> {
    if (this.status !== MesStatus.COMPLETED) {
      return Err('Faqat tugallangan sessiyani QC ga yuborish mumkin');
    }
    this.status = MesStatus.SENT_TO_QC;
    this.addDomainEvent({ type: 'MES_SENT_TO_QC', data: { sessionId: this.id } });
    return { ok: true, data: undefined };
  }

  /**
   * TB-safety / smena-readiness gate (Q-40 — real enforcement, no silent flip).
   *
   * Transitions READY → CHECKLIST_PENDING ONLY when every REQUIRED checklist item
   * for this session is completed/passed. The caller (StartSessionHandler) loads
   * the real {@link ChecklistStatus} from the canonical `setup_checklists` /
   * `checklist_items` tables and passes it in — the aggregate never reaches the DB.
   *
   * Blocking rules:
   *  - any required item incomplete → Err(BUSINESS_RULE_VIOLATION, "BLOCKED: ...")
   *    with `details.incomplete` listing the offending item titles; status stays READY.
   *  - no required items configured → BLOCKED (fail-safe): a missing safety checklist
   *    is treated as "safety not verified", NOT as "nothing to check". An operator may
   *    not start a session on a work-center whose readiness checklist was never set up.
   *
   * @param checklist - required-item snapshot for this session
   */
  passChecklist(checklist: ChecklistStatus): Result<void> {
    if (this.status !== MesStatus.READY) {
      return Err('Faqat tayyor sessiyani tekshiruv qilish mumkin');
    }

    if (checklist.requiredTotal === 0) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          'BLOCKED: smena-tayyorlik / TB-xavfsizlik chek-listi sozlanmagan — sessiyani boshlab bo\'lmaydi',
          { sessionId: this.id, reason: 'NO_CHECKLIST_CONFIGURED' },
        ),
      );
    }

    if (checklist.requiredIncomplete.length > 0) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          `BLOCKED: majburiy chek-list bandlari bajarilmagan (${checklist.requiredIncomplete.length}): ${checklist.requiredIncomplete.join(', ')}`,
          { sessionId: this.id, incomplete: checklist.requiredIncomplete },
        ),
      );
    }

    this.status = MesStatus.CHECKLIST_PENDING;
    return { ok: true, data: undefined };
  }
}
