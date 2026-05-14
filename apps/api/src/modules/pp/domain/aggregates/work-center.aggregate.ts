/**
 * @module work-center.aggregate
 * @description Source module. See exports for details.
 */

export enum WorkCenterType {
  LINE = 'line',
  MACHINE = 'machine',
  WORKSHOP = 'workshop',
  MANUAL = 'manual',
}

export class WorkCenter {
  constructor(public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: WorkCenterType,
    public readonly capacity: number,
    public readonly costPerHour: number,
    public readonly certificationLmsCourseId: string | null,
    public readonly department: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date) {}
}
