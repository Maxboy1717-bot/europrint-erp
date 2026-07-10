/**
 * @module mes-crew-members.service
 * @description Business-logic service for machine crew members (08-mes #83).
 * Computes each member's contribution % (hissa%). Returns Result<T>; never throws.
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr, isErr } from '@common/result';
import { MesCrewMembersRepository, CrewMemberRow, AddCrewMemberInput } from '../infrastructure/repositories/mes-crew-members.repo';

export interface CrewMemberView {
  id: number;
  sessionId: number;
  employeeId: number;
  roleLabel: string | null;
  sharePercent: number | null;      // explicit stored share; null = auto (equal-split)
  effectiveSharePercent: number;    // computed contribution %
}

@Injectable()
export class MesCrewMembersService {
  constructor(private readonly repo: MesCrewMembersRepository) {}

  async listForSession(sessionId: number): Promise<Result<CrewMemberView[]>> {
    const res = await this.repo.listBySession(sessionId);
    if (isErr(res)) return Err(res.error);
    return Ok(this.applyContributionSplit(res.data));
  }

  async addMember(input: AddCrewMemberInput): Promise<Result<CrewMemberRow>> {
    if (!Number.isInteger(input.sessionId) || input.sessionId <= 0) {
      return Err(AppErr('VALIDATION', "sessionId musbat butun son bo'lishi kerak"));
    }
    if (!Number.isInteger(input.employeeId) || input.employeeId <= 0) {
      return Err(AppErr('VALIDATION', "employeeId musbat butun son bo'lishi kerak"));
    }
    if (input.sharePercent !== null && (input.sharePercent < 0 || input.sharePercent > 100)) {
      return Err(AppErr('VALIDATION', "sharePercent 0..100 oralig'ida bo'lishi kerak"));
    }
    return this.repo.addMember(input);
  }

  async removeMember(id: number): Promise<Result<{ id: number }>> {
    if (!Number.isInteger(id) || id <= 0) {
      return Err(AppErr('VALIDATION', "id musbat butun son bo'lishi kerak"));
    }
    return this.repo.removeMember(id);
  }

  /**
   * Hissa%-ni hisoblash: aniq share_percent bilan a'zolar o'z foizini saqlaydi;
   * NULL-share a'zolar qolgan (100 - aniq foizlar) ni teng bo'lishadi; barchasi
   * NULL bo'lsa → 100/N teng-taqsim. Q-40: fabrikatsiya emas, aniq qoida.
   */
  private applyContributionSplit(rows: CrewMemberRow[]): CrewMemberView[] {
    const list = Array.isArray(rows) ? rows : [];
    const auto = list.filter((r) => r.sharePercent === null || r.sharePercent === undefined);
    const explicitSum = list.reduce((s, r) => s + Number(r.sharePercent ?? 0), 0);
    const remaining = Math.max(0, 100 - explicitSum);
    const autoShare = auto.length > 0 ? remaining / auto.length : 0;
    return list.map((r) => {
      const stored = r.sharePercent === null || r.sharePercent === undefined ? null : Number(r.sharePercent);
      const effective = stored === null ? Math.round(autoShare * 100) / 100 : stored;
      return {
        id: r.id,
        sessionId: r.sessionId,
        employeeId: r.employeeId,
        roleLabel: r.roleLabel ?? null,
        sharePercent: stored,
        effectiveSharePercent: effective,
      };
    });
  }
}
