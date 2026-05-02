import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@nestjs/cqrs';
import { MaintenanceStatus, MaintenanceType } from '../enums/maintenance-status.enum';

export class MaintenanceOrder extends AggregateRoot {
  id: string;
  machineId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: Date;
  completionDate: Date | null;
  technicianId: number | null;
  createdAt: Date;
  updatedAt: Date;

  // New fields for extended MRO functionality
  equipmentId: string;
  equipmentName: string;
  issueDescription: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string | null;
  productionOrderAffected: string | null;
  completedAt: Date | null;

  constructor(
    equipmentId: string,
    equipmentName: string,
    issueDescription: string,
    priority: 'low' | 'medium' | 'high' | 'critical',
  );
  constructor(
    machineId: string,
    type: MaintenanceType,
    description: string,
    scheduledDate: Date,
  );
  constructor(
    machineIdOrEquipmentId: string,
    typeOrEquipmentName: MaintenanceType | string,
    descriptionOrIssueDescription: string,
    scheduledDateOrPriority: Date | 'low' | 'medium' | 'high' | 'critical',
  ) {
    super();
    this.id = uuid();

    // Determine constructor type based on arguments
    if (
      typeof scheduledDateOrPriority === 'string' ||
      (typeof scheduledDateOrPriority === 'string' &&
        ['low', 'medium', 'high', 'critical'].includes(scheduledDateOrPriority))
    ) {
      // New constructor
      this.equipmentId = machineIdOrEquipmentId;
      this.equipmentName = typeOrEquipmentName as string;
      this.issueDescription = descriptionOrIssueDescription;
      this.priority = scheduledDateOrPriority as 'low' | 'medium' | 'high' | 'critical';
      this.status = MaintenanceStatus.SCHEDULED;
      this.assignedTo = null;
      this.productionOrderAffected = null;
      this.completedAt = null;
      // Legacy fields
      this.machineId = machineIdOrEquipmentId;
      this.type = MaintenanceType.PREVENTIVE;
      this.description = descriptionOrIssueDescription;
      this.scheduledDate = _time.now();
      this.completionDate = null;
      this.technicianId = null;
    } else {
      // Old constructor
      this.machineId = machineIdOrEquipmentId;
      this.type = typeOrEquipmentName as MaintenanceType;
      this.status = MaintenanceStatus.SCHEDULED;
      this.description = descriptionOrIssueDescription;
      this.scheduledDate = scheduledDateOrPriority as Date;
      this.completionDate = null;
      this.technicianId = null;
      // New fields
      this.equipmentId = machineIdOrEquipmentId;
      this.equipmentName = '';
      this.issueDescription = descriptionOrIssueDescription;
      this.priority = 'medium';
      this.assignedTo = null;
      this.productionOrderAffected = null;
      this.completedAt = null;
    }

    this.createdAt = _time.now();
    this.updatedAt = _time.now();
  }

  start(technicianId: number): void {
    this.status = MaintenanceStatus.IN_PROGRESS;
    this.technicianId = technicianId;
    this.updatedAt = _time.now();
  }

  complete(): void {
    this.status = MaintenanceStatus.COMPLETED;
    this.completionDate = _time.now();
    this.completedAt = _time.now();
    this.updatedAt = _time.now();
  }

  fail(): void {
    this.status = MaintenanceStatus.FAILED;
    this.updatedAt = _time.now();
  }

  assign(technicianId: string): void {
    this.assignedTo = technicianId;
    this.status = MaintenanceStatus.IN_PROGRESS;
    this.updatedAt = _time.now();
  }

  static create(
    machineId: string,
    type: MaintenanceType,
    description: string,
    scheduledDate: Date,
  ): MaintenanceOrder {
    return new MaintenanceOrder(machineId, type, description, scheduledDate);
  }

  static createForEquipment(
    equipmentId: string,
    equipmentName: string,
    issueDescription: string,
    priority: 'low' | 'medium' | 'high' | 'critical',
  ): MaintenanceOrder {
    return new MaintenanceOrder(equipmentId, equipmentName, issueDescription, priority);
  }
}
