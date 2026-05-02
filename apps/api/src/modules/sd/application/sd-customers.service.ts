import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { DrizzleSdCustomersRepository } from '../infrastructure/repositories/drizzle-sd-customers.repo';

@Injectable()
export class SdCustomersService {
  constructor(private readonly repo: DrizzleSdCustomersRepository) {}

  async list(search: string | undefined, status: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const pat = search ? `%${search}%` : null;
      return this.repo.list(pat, status, lim, off);
    });
  }

  async getById(cid: number) {
    return safeCall(async () => this.repo.getById(cid));
  }

  async get360View(cid: number) {
    return safeCall(async () => this.repo.get360View(cid));
  }

  async update(cid: number, body: Record<string, unknown>) {
    return safeCall(async () => this.repo.update(cid, body));
  }

  async softDelete(cid: number) {
    return safeCall(async () => this.repo.softDelete(cid));
  }

  async getContacts(cid: number) {
    return safeCall(async () => this.repo.getContacts(cid));
  }

  async addContact(cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, is_primary: unknown) {
    return safeCall(async () => this.repo.addContact(cid, full_name, phone, email, position, is_primary));
  }

  async updateContact(kid: number, cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown) {
    return safeCall(async () => this.repo.updateContact(kid, cid, full_name, phone, email, position));
  }

  async deleteContact(kid: number, cid: number) {
    return safeCall(async () => this.repo.deleteContact(kid, cid));
  }

  async getInteractions(cid: number) {
    return safeCall(async () => this.repo.getInteractions(cid));
  }

  async addInteraction(cid: number, type: unknown, notes: unknown, employee_id: unknown) {
    return safeCall(async () => this.repo.addInteraction(cid, type, notes, employee_id));
  }

  async getDocuments(cid: number) {
    return safeCall(async () => this.repo.getDocuments(cid));
  }

  async addDocument(cid: number, type: unknown, name: unknown, url: unknown, notes: unknown) {
    return safeCall(async () => this.repo.addDocument(cid, type, name, url, notes));
  }

  async deleteDocument(cid: number, did: number) {
    return safeCall(async () => this.repo.deleteDocument(cid, did));
  }

  async getCompetitors(cid: number) {
    return safeCall(async () => this.repo.getCompetitors(cid));
  }

  async deleteCompetitor(customerId: number, competitorId: number) {
    return safeCall(async () => this.repo.deleteCompetitor(customerId, competitorId));
  }

  async getComplaints(cid: number) {
    return safeCall(async () => this.repo.getComplaints(cid));
  }

  async resolveComplaint(customerId: number, complaintId: number, resolution: string, resolvedBy: number | null) {
    return safeCall(async () => this.repo.resolveComplaint(customerId, complaintId, resolution, resolvedBy));
  }
}
