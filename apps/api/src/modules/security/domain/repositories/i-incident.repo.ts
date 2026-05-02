import { Result } from '@common/types/result.type';
import { SecurityIncident } from '../aggregates/security-incident.aggregate';

export interface IIncidentRepo {
  findById(id: string): Promise<Result<SecurityIncident | null>>;
  findAll(filters: {
    severity?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: SecurityIncident[]; total: number }>>;
  findOpen(): Promise<Result<SecurityIncident[]>>;
  save(incident: SecurityIncident): Promise<Result<SecurityIncident>>;
  update(id: string, data: Partial<SecurityIncident>): Promise<Result<SecurityIncident>>;
}

export const INCIDENT_REPO = Symbol('INCIDENT_REPO');
