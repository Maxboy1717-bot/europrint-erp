/**
 * @module ai-data.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import {
  users,
  crmLeads,
  crmDeals,
  crmContacts,
  hrCandidateFunnels,
  hrToolTestResults,
  positions,
} from '@europrint/schemas';
import { count, eq, and, isNull } from 'drizzle-orm';

@Injectable()
export class AiDataRepository {

  async getExecutiveSummaryMetrics(): Promise<{
    totalEmployees: number;
    activeLeads:    number;
    activeDeals:    number;
    openPositions:  number;
  }> {
    const [empRow, leadRow, dealRow, posRow] = await Promise.all([
      db.select({ cnt: count() }).from(users).where(isNull(users.deletedAt)),
      db.select({ cnt: count() }).from(crmLeads).where(isNull(crmLeads.deleted_at)),
      db.select({ cnt: count() }).from(crmDeals).where(isNull(crmDeals.deleted_at)),
      db.select({ cnt: count() }).from(hrCandidateFunnels).where(eq(hrCandidateFunnels.isActive, true)),
    ]);
    return {
      totalEmployees: Number(empRow[0]?.cnt  ?? 0),
      activeLeads:    Number(leadRow[0]?.cnt  ?? 0),
      activeDeals:    Number(dealRow[0]?.cnt  ?? 0),
      openPositions:  Number(posRow[0]?.cnt   ?? 0),
    };
  }

  async getLeadById(leadId: number): Promise<Record<string, unknown> | null> {
    const rows = await db
      .select()
      .from(crmLeads)
      .where(and(eq(crmLeads.id, leadId), isNull(crmLeads.deleted_at)))
      .limit(1) as Array<Record<string, unknown>>;
    return rows[0] ?? null;
  }

  async getDealById(dealId: number): Promise<Record<string, unknown> | null> {
    const rows = await db
      .select()
      .from(crmDeals)
      .where(and(eq(crmDeals.id, dealId), isNull(crmDeals.deleted_at)))
      .limit(1) as Array<Record<string, unknown>>;
    return rows[0] ?? null;
  }

  async getDealSummaryById(dealId: number): Promise<{ title: string | null; amount: string | null; stage_id: string | null } | null> {
    const rows = await db
      .select({ title: crmDeals.title, amount: crmDeals.amount, stage_id: crmDeals.stage_id })
      .from(crmDeals)
      .where(eq(crmDeals.id, dealId))
      .limit(1);
    return rows[0] ?? null;
  }

  async getContactById(contactId: number): Promise<Record<string, unknown> | null> {
    const rows = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.id, contactId))
      .limit(1) as Array<Record<string, unknown>>;
    return rows[0] ?? null;
  }

  async getToolTestById(toolTestId: number): Promise<Record<string, unknown> | null> {
    const rows = await db
      .select()
      .from(hrToolTestResults)
      .where(eq(hrToolTestResults.id, toolTestId))
      .limit(1) as Array<Record<string, unknown>>;
    return rows[0] ?? null;
  }

  async getEmployeeWithPosition(employeeId: number): Promise<{ fullName: string | null; positionName: string | null } | null> {
    const rows = await db
      .select({ fullName: users.fullName, positionName: positions.name })
      .from(users)
      .leftJoin(positions, eq(users.positionId, positions.id))
      .where(eq(users.id, employeeId))
      .limit(1);
    return rows[0] ?? null;
  }
}
