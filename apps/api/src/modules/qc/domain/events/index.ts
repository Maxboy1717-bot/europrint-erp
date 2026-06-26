/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class QcPassedEvent {
  constructor(readonly inspectionId: string,
    readonly orderId: number) {}
}

export class QcFailedEvent {
  constructor(
    readonly inspectionId: string,
    readonly orderId: number,
    readonly reason: string,
  ) {}
}

/**
 * Emitted when an inspector's third QC decision is REWORK (Qayta ishlash) —
 * the batch is neither accepted (pass) nor scrapped (fail) but sent back to
 * production for rework. Carries the optional inspector reason so downstream
 * MES/PP listeners can re-open the job. Mirrors the WMS quarantine REWORK
 * decision but on the qc_inspections aggregate path.
 */
export class QcReworkEvent {
  constructor(
    readonly inspectionId: string,
    readonly orderId: number,
    readonly reason: string,
  ) {}
}

export class SupplierQualityFailEvent {
  constructor(
    readonly supplierId: number,
    readonly orderId: number,
    readonly reason: string,
  ) {}
}

/**
 * Wave 4 round-2 (PA2-18): canonical event class for the `qc.lab.passed`
 *   topic. The PP `DesignLabCompletedListener` was previously listening via
 *   `@OnEvent(ERP_EVENTS.LAB_TEST_PASSED)`; it now subscribes to this class.
 *   EventBridge keeps re-emitting to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   No production code currently publishes this event on the CQRS bus
 *   (the legacy listener received string-topic emits only); the listener
 *   is therefore a no-op at runtime until a publisher is wired — same
 *   dead-letter state as the legacy @OnEvent listener was previously in.
 */
export class LabTestPassedEvent {
  constructor(
    readonly orderId: number,
    readonly inspectionId?: number,
    readonly passedAt?: string,
  ) {}
}
