/**
 * @module update-incident.command
 * @description Source module. See exports for details.
 */

export class UpdateIncidentCommand {
  constructor(readonly incidentId: string,
    readonly assignedTo?: string,
    readonly status?: 'open' | 'investigating' | 'resolved' | 'closed',
    readonly resolutionNotes?: string) {}
}
