/**
 * @module resolve-reclamation.command
 * @description Source module. See exports for details.
 */

export class ResolveReclamationCommand {
  constructor(public readonly reclamationId: number,
    public readonly status: string | null,
    public readonly resolution: string | null) {}
}
