/**
 * @module nda-auto-issue.listener
 * @description Onboarding avto-NDA (modul 02, 02.41 "onboarding'da majburiy imzo"). Xodim
 *   yaratilganda (`employee.created`) uning user_id'siga pending NDA avtomatik beriladi.
 *   Avval NDA faqat qo'lda berilardi — bu golden-thread onboarding'ni avtomatlashtiradi.
 * @layer Listener (HR / NDA)
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NdaRepository } from './nda.repository';

@Injectable()
export class NdaAutoIssueListener {
  private readonly logger = new Logger(NdaAutoIssueListener.name);
  constructor(private readonly repo: NdaRepository) {}

  @OnEvent('employee.created')
  async onEmployeeCreated(payload: { employeeId?: number }): Promise<void> {
    const employeeId = payload?.employeeId;
    if (!employeeId) return;
    const r = await this.repo.autoIssueForEmployee(employeeId, 'v1');
    if (!r.ok) {
      this.logger.warn(`Avto-NDA berilmadi (employee=${employeeId}): ${r.error.message}`);
      return;
    }
    if (r.data.id) this.logger.log(`Avto-NDA berildi: employee=${employeeId} → nda=${r.data.id}`);
  }
}
