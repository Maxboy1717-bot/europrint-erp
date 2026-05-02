export class UpdateDesignStatusCommand {
  constructor(public readonly id: string,
    public readonly status: string,
    public readonly userId: string,
    public readonly files?: string[]) {}
}
