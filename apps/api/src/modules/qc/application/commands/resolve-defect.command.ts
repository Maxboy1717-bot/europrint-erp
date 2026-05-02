export class ResolveDefectCommand {
  constructor(public readonly defectId: string,
    public readonly userId: string,
    public readonly resolution: string) {}
}
