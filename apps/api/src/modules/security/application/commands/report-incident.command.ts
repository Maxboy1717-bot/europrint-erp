/**
 * @module report-incident.command
 * @description Source module. See exports for details.
 */

export class ReportIncidentCommand {
  constructor(readonly type: string,
    readonly severity: string,
    readonly title: string,
    readonly description: string,
    readonly reportedBy: number) {}
}

export class ResolveIncidentCommand {
  constructor(readonly incidentId: string) {}
}
