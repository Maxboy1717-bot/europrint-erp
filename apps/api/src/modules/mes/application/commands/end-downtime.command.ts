export class EndDowntimeCommand {
  constructor(public readonly id: string,
    public readonly endedAt?: Date) {}
}
