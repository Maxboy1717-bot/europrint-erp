export class Department {
  constructor(public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly headId: string | null,
    public readonly parentId: string | null,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date) {}
}
