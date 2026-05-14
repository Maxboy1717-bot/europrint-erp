/**
 * @module integration-mro.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { IntegrationMroRepository } from './integration-mro.repo';
import { CreateMroItemDto, CreateMroRequestDto } from './dto/mro.dto';

@Injectable()
export class IntegrationMroService {

  constructor(private readonly repo: IntegrationMroRepository) {}

  getItems(category?: string): Promise<Result<object, AppError>> {
    return this.repo.findItems(category);
  }

  createItem(dto: CreateMroItemDto) {
    return this.repo.insertItem(dto);
  }

  getRequests(status?: string) {
    return this.repo.findRequests(status);
  }

  createRequest(dto: CreateMroRequestDto) {
    return this.repo.insertRequest(dto);
  }

  approveRequest(id: string, action: string) {
    const status = action === 'approve' ? 'approved' : 'rejected';
    return this.repo.updateRequestStatus(id, status);
  }

  getEquipment() {
    return this.repo.findEquipment();
  }

  getStats() {
    return this.repo.getStats();
  }

  getBudgets() {
    return this.repo.findBudgets();
  }

  getCleaningSchedules() {
    return this.repo.findCleaningSchedules();
  }

  getUtilityReadings() {
    return this.repo.findUtilityReadings();
  }

  getFacilities() {
    return this.repo.findFacilities();
  }
}
