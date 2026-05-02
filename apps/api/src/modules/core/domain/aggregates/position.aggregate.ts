export class Position {
  constructor(public readonly id: string,
    public readonly title: string,
    public readonly code: string,
    public readonly departmentId: string,
    public readonly level: number,
    public readonly minSalary: number,
    public readonly maxSalary: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date) {}
}
