/**
 * @module lead-aging-reassign.cron
 * @description VISION-3340 #33 — Lead-aging avtomatik qayta biriktirish.
 *
 *   Muammo: `crm_leads.last_activity_at` / `next_activity_at` to'ldirilyapti,
 *   lekin ularni HECH KIM o'qimaydi — 60+ kun sovigan (hech qanday faoliyat
 *   bo'lmagan), hali yakunlanmagan (won/lost/converted emas) lead'lar joriy
 *   menejerda "muzlab" qoladi.
 *
 *   Yechim: har kuni ertalab shu lead'larni topib, mavjud round-robin
 *   (`WebsiteLeadRepository.pickNextSalesManager`) orqali navbatdagi faol
 *   sotuv menejeriga QAYTA biriktiradi (`assignManagerIfMissing(..., true)`
 *   — overwrite=true, VISION-3340 #33 uchun qo'shilgan opt-in parametr) va
 *   har bir qayta biriktirishni `crm_activities`'ga audit-note sifatida
 *   yozadi (`logLeadReassignmentNote`).
 *
 *   Ketma-ket (sequential) ishlaydi — chunki round-robin hisoblash
 *   (`pickNextSalesManager`) navbatdagi menejerni oxirgi 30 kunlik
 *   biriktirilgan-lead sonini DB'dan o'qib aniqlaydi; parallel bajarilsa
 *   bir nechta lead bitta menejerga "yopishib qolishi" mumkin edi.
 *
 * @layer Cron (CRM)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isErr } from '@common/result';
import { WebsiteLeadRepository } from '../listeners/website-lead.repository';
import {
  CRM_LEAD_AGING_REASSIGN_DAYS,
  CRM_LEAD_TERMINAL_STATUSES,
} from '@common/constants/business.constants';

@Injectable()
export class LeadAgingReassignCron {
  private readonly logger = new Logger(LeadAgingReassignCron.name);

  constructor(private readonly repo: WebsiteLeadRepository) {}

  /**
   * Har kuni 07:00 (Toshkent) — sovigan lead'larni qayta biriktiradi.
   */
  @Cron('0 7 * * *', { timeZone: 'Asia/Tashkent' })
  async reassignColdLeads(): Promise<void> {
    const coldR = await this.repo.findColdLeadsForReassignment(
      CRM_LEAD_AGING_REASSIGN_DAYS,
      CRM_LEAD_TERMINAL_STATUSES,
    );
    if (isErr(coldR)) {
      this.logger.error(`findColdLeadsForReassignment: ${coldR.error.message}`);
      return;
    }
    const coldLeads = Array.isArray(coldR.data) ? coldR.data : [];
    if (coldLeads.length === 0) return;

    this.logger.log(`Lead-aging: ${coldLeads.length} ta ${CRM_LEAD_AGING_REASSIGN_DAYS}+ kun sovigan lead qayta biriktirilmoqda`);

    for (const lead of coldLeads) {
      await this.reassignOne(lead.id, lead.managerId);
    }
  }

  private async reassignOne(leadId: number, previousManagerId: number | null): Promise<void> {
    const managerR = await this.repo.pickNextSalesManager();
    if (isErr(managerR)) {
      this.logger.warn(`Lead #${leadId}: menejer tanlashda xatolik — ${managerR.error.message}`);
      return;
    }
    const newManagerId = managerR.data;
    if (newManagerId === null) {
      this.logger.warn(`Lead #${leadId}: faol sotuv menejeri topilmadi, o'tkazib yuborildi`);
      return;
    }
    if (newManagerId === previousManagerId) {
      // Round-robin joriy menejerni qayta tanladi — haqiqiy qayta biriktirish yo'q.
      return;
    }

    const assignR = await this.repo.assignManagerIfMissing(leadId, newManagerId, true);
    if (isErr(assignR)) {
      this.logger.warn(`Lead #${leadId}: qayta biriktirishda xatolik — ${assignR.error.message}`);
      return;
    }
    if (!assignR.data) {
      this.logger.warn(`Lead #${leadId}: qayta biriktirish bajarilmadi (lead topilmadi?)`);
      return;
    }

    const noteR = await this.repo.logLeadReassignmentNote(
      leadId, previousManagerId, newManagerId, CRM_LEAD_AGING_REASSIGN_DAYS,
    );
    if (isErr(noteR)) {
      this.logger.warn(`Lead #${leadId}: audit-note yozilmadi — ${noteR.error.message}`);
    }
  }
}
