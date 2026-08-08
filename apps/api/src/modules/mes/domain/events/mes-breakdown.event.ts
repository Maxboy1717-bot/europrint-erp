/**
 * @module mes-breakdown.event
 * @description Domain event payload. Emitted via `eventBus.publish(new MesBreakdownEvent(...))`
 *   when an EMERGENCY/breakdown downtime auto-opens a maintenance request+task
 *   (VISION 08-mes#37 "Avariya remont") — record-downtime.handler.ts, right after
 *   `MesMaintenanceRepository.createFromDowntime` reports `outcome: 'created'`.
 *
 *   Consumed by the Kanban module's fan-out handler (owner decision 2026-07-13:
 *   QC/MES/Design all mirror their real domain events into a Kanban card) so the
 *   breakdown is visible as a Kanban task, not just an internal
 *   `mes_maintenance_requests`/`mes_maintenance_tasks` row.
 */

export class MesBreakdownEvent {
  constructor(
    public readonly requestId: number,
    public readonly taskId: number,
    public readonly sessionId: number,
    /** Down machine / work-center id (mes_maintenance_requests.equipment_id) — may be
     *  null when neither the downtime event nor the session carried one (no fabrication). */
    public readonly equipmentId: number | null,
    public readonly reasonCode: string,
    public readonly description: string,
    public readonly timestamp: Date,
  ) {}
}
