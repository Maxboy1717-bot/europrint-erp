export class UpdateIncidentCommand {
  constructor(readonly incidentId: string,
    readonly assignedTo?: string,
    readonly status?: 'open' | 'investigating' | 'resolved' | 'closed',
    readonly resolutionNotes?: string) {}
}
