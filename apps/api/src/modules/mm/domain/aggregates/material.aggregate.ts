/**
 * @module material.aggregate
 * @description Source module. See exports for details.
 */

export class Material {
  constructor(public readonly id: string,
    public readonly materialCode: string,
    public readonly name: string,
    public readonly category: string,
    public readonly unitOfMeasure: string,
    public readonly minStock: number,
    public readonly maxStock: number,
    public readonly unitCost: number,
    public currentStock: number,
    public isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  get isLowStock(): boolean {
    return this.currentStock < this.minStock;
  }

  get isOverStock(): boolean {
    return this.currentStock > this.maxStock;
  }
}
