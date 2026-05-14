/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class SecurityIncidentDetectedEvent {
  constructor(readonly incidentId: string,
    readonly type: string,
    readonly severity: string) {}
}

export class SecurityIncidentResolvedEvent {
  constructor(
    readonly incidentId: string,
    readonly resolvedAt: Date,
  ) {}
}
