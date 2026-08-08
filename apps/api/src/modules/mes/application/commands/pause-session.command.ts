/**
 * @module pause-session.command
 * @description Source module. See exports for details.
 */

export class PauseSessionCommand {
  constructor(
    public readonly sessionId: number,
    public readonly reason?: string,
  ) {}
}
