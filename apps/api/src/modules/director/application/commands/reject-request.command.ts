/**
 * @module reject-request.command
 * @description Source module. See exports for details.
 */

export class RejectRequestCommand {
  constructor(public readonly id: string,
    public readonly userId: string,
    public readonly reason: string) {}
}
