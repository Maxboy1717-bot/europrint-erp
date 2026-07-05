/**
 * @module update-material.command
 * @description Source module. See exports for details.
 */

export class UpdateMaterialCommand {
  constructor(public readonly materialId: string,
    public readonly name?: string,
    public readonly category?: string,
    public readonly unitOfMeasure?: string,
    public readonly minStock?: number,
    public readonly maxStock?: number,
    public readonly unitCost?: number,
    public readonly isActive?: boolean,
    public readonly updatedBy?: number) {}
}
