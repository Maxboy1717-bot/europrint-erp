/**
 * @module set-fault-attribution.command
 * @description CQRS command: tag a QC defect as customer-fault or not (owner decision
 * 2026-07-13, chat). TRUE auto-notifies the sales manager who owns the linked order's
 * customer — see set-fault-attribution.handler.ts + QcDefectCustomerFaultEvent.
 */

export class SetFaultAttributionCommand {
  constructor(
    public readonly defectId: string,
    public readonly isCustomerFault: boolean,
    public readonly userId: string,
  ) {}
}
