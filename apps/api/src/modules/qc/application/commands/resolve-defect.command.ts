/**
 * @module resolve-defect.command
 * @description Source module. See exports for details.
 */

export class ResolveDefectCommand {
  constructor(public readonly defectId: string,
    public readonly userId: string,
    public readonly resolution: string) {}
}
