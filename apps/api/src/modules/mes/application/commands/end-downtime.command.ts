/**
 * @module end-downtime.command
 * @description Source module. See exports for details.
 */

export class EndDowntimeCommand {
  constructor(public readonly id: string,
    public readonly endedAt?: Date) {}
}
