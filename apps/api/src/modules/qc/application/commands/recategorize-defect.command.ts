/**
 * @module recategorize-defect.command
 * @description Source module. See exports for details.
 */

export class RecategorizeDefectCommand {
  constructor(
    public readonly defectId: string,
    public readonly defectType: string,
    public readonly userId: string,
  ) {}
}
