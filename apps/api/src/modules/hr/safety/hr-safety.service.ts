import { Injectable } from '@nestjs/common';
import { HrSafetyRepository } from './hr-safety.repository';
import { Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrSafetyService {
  constructor(private readonly repo: HrSafetyRepository) {}

  getDepartmentSummary(): Promise<Result<Row[]>> {
    return this.repo.findDepartmentSummary();
  }

  getIncidentById(id: number): Promise<Result<Row | null>> {
    return this.repo.findIncidentById(id);
  }

  updateIncident(id: number, data: Row): Promise<Result<Row>> {
    return this.repo.updateIncident(id, data);
  }

  getHazardZoneById(id: number): Promise<Result<Row | null>> {
    return this.repo.findHazardZoneById(id);
  }

  updateHazardZone(id: number, data: Row): Promise<Result<Row>> {
    return this.repo.updateHazardZone(id, data);
  }

  getAllIncidents(): Promise<Result<Row[]>> {
    return this.repo.findAllIncidents();
  }
}
