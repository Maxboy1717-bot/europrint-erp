/**
 * @module security-incident.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@nestjs/cqrs';
import { IncidentSeverity, IncidentType } from '../enums/incident-severity.enum';

export class SecurityIncident extends AggregateRoot {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity | string;
  title: string;
  description: string;
  detectedAt: Date;
  resolvedAt: Date | null;
  reportedBy: number;
  affectedUsers: number[];
  createdAt: Date;
  updatedAt: Date;

  // New fields for extended incident functionality
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reporterId: string | null;
  assignedTo: string | null;
  resolutionNotes: string | null;

  constructor(title: string, description: string, severity: IncidentSeverity | string);
  constructor(
    type: IncidentType,
    severity: IncidentSeverity,
    title: string,
    description: string,
    reportedBy: number,
  );
  constructor(
    typeOrTitle: IncidentType | string,
    severityOrDescription?: IncidentSeverity | string,
    titleOrDescription?: string,
    descriptionOrReportedBy?: string | number,
    reportedBy?: number,
  ) {
    super();
    this.id = uuid();

    if (typeof descriptionOrReportedBy === 'string' || descriptionOrReportedBy === undefined) {
      // New constructor: (title, description, severity)
      this.title = typeOrTitle as string;
      this.description = severityOrDescription as string;
      this.severity = titleOrDescription as string;
      this.type = IncidentType.UNAUTHORIZED_ACCESS;
      this.reportedBy = 0;
      this.status = 'open';
      this.reporterId = null;
      this.assignedTo = null;
      this.resolutionNotes = null;
    } else {
      // Old constructor: (type, severity, title, description, reportedBy)
      this.type = typeOrTitle as IncidentType;
      this.severity = severityOrDescription as IncidentSeverity;
      this.title = titleOrDescription ?? '';
      this.description = String(descriptionOrReportedBy);
      this.reportedBy = reportedBy ?? 0;
      this.status = 'open';
      this.reporterId = null;
      this.assignedTo = null;
      this.resolutionNotes = null;
    }

    this.detectedAt = _time.now();
    this.resolvedAt = null;
    this.affectedUsers = [];
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
  }

  addAffectedUser(userId: number): void {
    if (!this.affectedUsers.includes(userId)) {
      this.affectedUsers.push(userId);
    }
  }

  resolve(): void {
    this.resolvedAt = _time.now();
    this.status = 'resolved';
    this.updatedAt = _time.now();
  }

  updateStatus(newStatus: 'open' | 'investigating' | 'resolved' | 'closed'): void {
    this.status = newStatus;
    this.updatedAt = _time.now();
  }

  assign(assignedTo: string): void {
    this.assignedTo = assignedTo;
    this.status = 'investigating';
    this.updatedAt = _time.now();
  }

  closeIncident(resolutionNotes: string): void {
    this.resolutionNotes = resolutionNotes;
    this.status = 'closed';
    this.resolvedAt = _time.now();
    this.updatedAt = _time.now();
  }

  static create(
    type: IncidentType,
    severity: IncidentSeverity,
    title: string,
    description: string,
    reportedBy: number,
  ): SecurityIncident {
    return new SecurityIncident(type, severity, title, description, reportedBy);
  }

  static createIncident(
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): SecurityIncident {
    return new SecurityIncident(title, description, severity);
  }
}

