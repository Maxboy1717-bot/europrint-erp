/**
 * @module approve-request.command
 * @description Source module. See exports for details.
 */

export class ApproveRequestCommand {
  constructor(public readonly id: string,
    public readonly userId: string,
    public readonly notes?: string) {}
}
