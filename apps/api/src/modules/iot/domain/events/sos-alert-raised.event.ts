/**
 * @module sos-alert-raised.event
 * @description Domain event published when an operator presses the SOS button on
 *   the IoT tablet PWA. Downstream listeners are expected to (a) push a high-
 *   priority Telegram alert to shop-floor managers and (b) escalate via the
 *   safety-violations module. Mapped in EventBridge to `iot.sos.raised`.
 */

export class SosAlertRaisedEvent {
  readonly eventName = 'SosAlertRaised';
  constructor(
    readonly alertId: number,
    readonly workerId: number,
    readonly equipmentId: number | null,
    readonly alertType: string,
    readonly message: string,
    readonly raisedAt: Date = new Date(),
  ) {}
}
