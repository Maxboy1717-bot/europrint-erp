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
