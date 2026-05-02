import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmAutoLeadRepository } from './crm-auto-lead.repository';

@Injectable()
export class CrmAutoLeadService {
  constructor(private readonly repo: CrmAutoLeadRepository) {}

  async quickScore(entityType: string, eid: number): Promise<Result<object | null, AppError>> {
    return safeCall(async () => {
      if (entityType === 'lead') {
        const rResult = await this.repo.findLeadScore(eid);
        const r = (rResult.ok ? rResult.data : null) as Record<string, unknown> | null;
        return r ? { entity_type: 'lead', id: eid, score: r['ai_score'] ?? 0, status: r['status'] } : null;
      } else {
        const rResult = await this.repo.findDeal(eid);
        const r = (rResult.ok ? rResult.data : null) as Record<string, unknown> | null;
        return r ? { entity_type: 'deal', id: eid, score: 50, status: r['status'] } : null;
      }
    });
  }

  async getSupervisorDashboard() {
    return this.repo.getSupervisorDashboard();
  }

  async getAutoLeadSources() {
    return this.repo.getAutoLeadSources();
  }

  async ingestCallLead(phone: unknown, first_name: unknown, last_name: unknown, notes: unknown, source_meta: unknown) {
    return this.repo.ingestCallLead(phone, first_name, last_name, notes, source_meta);
  }

  async ingestFormLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, form_name: unknown, notes: unknown) {
    return this.repo.ingestFormLead(email, phone, first_name, last_name, form_name, notes);
  }

  async ingestTelegramLead(telegram_id: unknown, first_name: unknown, last_name: unknown, username: unknown, message: unknown) {
    return this.repo.ingestTelegramLead(first_name, last_name, username, message);
  }

  async ingestWebsiteLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, page_url: unknown, message: unknown) {
    return this.repo.ingestWebsiteLead(email, phone, first_name, last_name, page_url, message);
  }
}
