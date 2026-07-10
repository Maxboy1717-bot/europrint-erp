/**
 * @module mes-crew-members.repo
 * @description Repository / data-access layer for machine_crew_members
 * (08-mes #83: 1 operator + N nomli yordamchi + hissa%). Wraps Drizzle ORM;
 * returns Result<T>. Repo owns the DB (Qoida 15).
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { machineCrewMembers } from '@europrint/schemas';
import { eq } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';

export type CrewMemberRow = typeof machineCrewMembers.$inferSelect;

export interface AddCrewMemberInput {
  sessionId: number;
  employeeId: number;
  roleLabel: string | null;
  sharePercent: number | null;
}

@Injectable()
export class MesCrewMembersRepository {
  async listBySession(sessionId: number): Promise<Result<CrewMemberRow[]>> {
    try {
      const rows = await db.select().from(machineCrewMembers).where(eq(machineCrewMembers.sessionId, sessionId));
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Jamoa a'zolarini o'qishda xatolik";
      return Err(AppErr('DB_ERROR', msg));
    }
  }

  async addMember(input: AddCrewMemberInput): Promise<Result<CrewMemberRow>> {
    try {
      const result = await db.insert(machineCrewMembers).values({
        sessionId: input.sessionId,
        employeeId: input.employeeId,
        roleLabel: input.roleLabel,
        sharePercent: input.sharePercent === null ? null : String(input.sharePercent),
      } as typeof machineCrewMembers.$inferInsert).returning();
      const rows = Array.isArray(result) ? result : [];
      const created = rows[0];
      if (!created) return Err(AppErr('DB_ERROR', "Jamoa a'zosi yaratilmadi"));
      return Ok(created);
    } catch (e: unknown) {
      const code = (e as { code?: string } | null)?.code;
      if (code === '23505') return Err(AppErr('CONFLICT', "Bu xodim allaqachon shu sessiya jamoasida"));
      const msg = e instanceof Error ? e.message : "Jamoa a'zosini qo'shishda xatolik";
      return Err(AppErr('DB_ERROR', msg));
    }
  }

  async removeMember(id: number): Promise<Result<{ id: number }>> {
    try {
      const result = await db.delete(machineCrewMembers).where(eq(machineCrewMembers.id, id)).returning();
      const rows = Array.isArray(result) ? result : [];
      if (!rows[0]) return Err(AppErr('NOT_FOUND', "Jamoa a'zosi topilmadi"));
      return Ok({ id });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Jamoa a'zosini o'chirishda xatolik";
      return Err(AppErr('DB_ERROR', msg));
    }
  }
}
