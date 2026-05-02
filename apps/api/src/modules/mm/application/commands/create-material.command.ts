export class CreateMaterialCommand {
  constructor(public readonly materialCode: string,
    public readonly name: string,
    public readonly category: string,
    public readonly unitOfMeasure: string,
    public readonly minStock: number,
    public readonly maxStock: number,
    public readonly unitCost: number) {}
}
