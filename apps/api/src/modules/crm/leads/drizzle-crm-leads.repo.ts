/**
 * @module drizzle-crm-leads.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { crmLeads } from '@europrint/schemas';
import { eq, and, isNull, count, desc, sql, getTableColumns } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { toBitrixStatusId } from './lead-status-id.util';
import { ICrmLeadsRepository } from './i-crm-leads.repo';
import { CrmLeadScoringService } from '../domain/services/crm-lead-scoring.service';

type Row = Record<string, unknown>;

/**
 * Map actual crm_leads DB columns → Bitrix24-style camelCase expected by the frontend.
 * Actual DB columns: contact_name, contact_phone, contact_email, status, source,
 *   customer_id, manager_id, created_at, deleted_at, notes
 *
 * SB0640/SB0652/SB0673 fix: `ai_score` used to be hardcoded `null` (LeadScoreBar.tsx
 * had no data to render). Now computed live via CrmLeadScoringService (EP-CRM-012
 * 5-criterion formula: budget/engagement/recency/source/fit) from real columns —
 * no fabricated data, score is 0 on any dimension where the underlying field is null.
 */
function mapLeadRow(r: Row, scoringService: CrmLeadScoringService): Row {
  const contactName = String(r['contact_name'] ?? '');
  const title = contactName || 'Nomsiz lid';
  const sourceId = (r['source_description'] ?? r['source_id'] ?? null) as string | null;
  const budgetUzs = Number(r['budget'] ?? r['opportunity_amount'] ?? r['estimated_volume'] ?? 0) || null;
  const lastActivityAt = (r['last_activity_at'] ?? null) as string | Date | null;
  const daysSinceLastActivity = lastActivityAt
    ? Math.max(0, Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000))
    : null;
  const scoreResult = scoringService.score({
    budgetUzs,
    // Real engagement: crm_activities count for this lead, surfaced by a correlated
    // subquery in findAll/findById (`activity_count`). Absent on the create/update return
    // rows (a just-written lead has ~0 activities) → null → the scorer treats engagement
    // as 0. No fabrication (Q-40): 0 only when there genuinely are no activities.
    activityCount: r['activity_count'] != null ? Number(r['activity_count']) : null,
    daysSinceLastActivity,
    source: sourceId,
    hasCompany: Boolean(r['company_title']),
    hasEmail: Boolean(r['contact_email']),
    hasPhone: Boolean(r['contact_phone']),
    hasWebsite: Boolean(r['websites']),
    employeeCount: null,
  });
  const aiScore = scoreResult.ok ? scoreResult.data.score : null;
  return {
    id:           r['id'],
    title,
    name:         contactName || null,
    lastName:     null,
    companyTitle: r['company_title'] ?? null,
    // Live crm_leads columns: status_id/status_description, source_id, assigned_to,
    // date_create, comments (NOT status/source/manager_id/created_at/notes/customer_id).
    // statusId is what the kanban board groups cards by → expose the FINE stage from
    // status_description (= LEAD_STAGES.stageId domain: NEW/IN_PROCESS/ANALYSIS/FINAL/
    // CONVERTED/WON/LOST/JUNK). status_id is the coarse Bitrix CHECK state {NEW,IN_PROCESS,
    // CONVERTED,JUNK} and can't represent all 8 columns, so it's only the fallback
    // for legacy rows that have no description.
    statusId:     r['status_description'] ? String(r['status_description']).toUpperCase() : (r['status_id'] ? String(r['status_id']).toUpperCase() : 'NEW'),
    // Lifecycle code (new/qualified/proposal/...) for the FE label; statusId stays the
    // coarse Bitrix state. Falls back to lower(status_id) for legacy rows w/o a description.
    status:       r['status_description'] ? String(r['status_description']) : (r['status_id'] ? String(r['status_id']).toLowerCase() : 'new'),
    phones:       r['contact_phone'] ? [{ value: r['contact_phone'], type: 'WORK' }] : [],
    emails:       r['contact_email'] ? [{ value: r['contact_email'], type: 'WORK' }] : [],
    sourceId,
    assignedById: r['assigned_to'] ? String(r['assigned_to']) : null,
    dateCreate:   r['date_create'] ?? new Date().toISOString(),
    opportunity:  budgetUzs ?? 0,
    notes:        r['comments'] ?? null,
    ai_score:     aiScore,
    companyId:    null,
    // Marketing-14 #59/#67: ofset/gofra/etiketka/flekso/blanka (null for legacy rows
    // or callers that haven't been updated to send it yet — see crm-leads.controller.ts).
    productType:  r['product_type'] ?? null,
    // EP-MKT-102 (Marketing #80, Hudud+eksport belgisi): raw column passthrough.
    region:       r['region'] ?? null,
    isExport:     Boolean(r['is_export']),
  };
}

@Injectable()
export class DrizzleCrmLeadsRepository implements ICrmLeadsRepository {
  constructor(private readonly scoringService: CrmLeadScoringService) {}

  async findAll(limit: number, offset: number, ownerId?: number | null): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      // Item A row-scoping: when ownerId is provided (non-privileged caller), restrict to leads the
      // caller owns. crmLeads.manager_id is the Drizzle property mapping to the physical assigned_to
      // column (the canonical ownership column). Applied to BOTH the count and the page so the
      // paginated total never leaks the global count. ownerId == null → privileged → no filter.
      const ownerFilter = ownerId != null ? eq(crmLeads.manager_id, ownerId) : undefined;
      const whereClause = ownerFilter ? and(isNull(crmLeads.deleted_at), ownerFilter) : isNull(crmLeads.deleted_at);
      const [countResult, rows] = await Promise.all([
        db.select({ count: count() }).from(crmLeads).where(whereClause).limit(1).offset(0),
        // ...all lead columns + a correlated crm_activities count so the scorer's engagement
        // dimension is real (was always 0). One query, no N+1.
        db.select({
          ...getTableColumns(crmLeads),
          activity_count: sql<number>`(SELECT COUNT(*)::int FROM crm_activities a WHERE a.lead_id = ${crmLeads.id})`,
        }).from(crmLeads).where(whereClause).orderBy(desc(crmLeads.created_at)).limit(limit).offset(offset),
      ]);
      return Ok({ data: (rows as Row[]).map(r => mapLeadRow(r, this.scoringService)), count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Lidlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db.select({
        ...getTableColumns(crmLeads),
        activity_count: sql<number>`(SELECT COUNT(*)::int FROM crm_activities a WHERE a.lead_id = ${crmLeads.id})`,
      }).from(crmLeads).where(and(eq(crmLeads.id, id), isNull(crmLeads.deleted_at))).limit(1).offset(0);
      const row = (rows as Row[])[0] || null;
      return Ok(row ? mapLeadRow(row, this.scoringService) : null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Lid #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const firstName   = (dto.firstName as string | undefined) ?? '';
      const lastNameVal = (dto.lastName as string | undefined) ?? '';
      // Fallback to fullName/name/contactName for callers that bypass normalizeLeadDto,
      // so contact_name is populated (converted customers get the real name, not "Lead #id").
      const contactName = ([firstName, lastNameVal].filter(Boolean).join(' ')
        || (dto.fullName as string | undefined)
        || (dto.name as string | undefined)
        || (dto.contactName as string | undefined)
        || '').toString().trim() || null;
      // CRM-1: title is NOT NULL — derive from dto.title, companyTitle, or name
      const titleValue = String(
        (dto.title as string | undefined) ||
        (dto.companyTitle as string | undefined) ||
        contactName ||
        'Yangi lid',
      );
      // Write the real compat-1a def properties (camelCase keys like name/phones/statusId
      // are NOT def properties and were silently dropped by Drizzle). Lifecycle goes to
      // status_description; status_id holds the mapped Bitrix coarse state (CHECK-safe).
      // Canonical fine stage = LEAD_STAGES.stageId (uppercase). Stored verbatim in
      // status_description (the field the board reads), so read==write equality holds.
      const lifecycle = String((dto.status as string | undefined) ?? (dto.statusId as string | undefined) ?? 'NEW').toUpperCase();
      const phoneVal = (dto.phone as string | undefined)
        ?? (Array.isArray(dto.phones) && dto.phones[0] ? String((dto.phones[0] as { value?: unknown }).value ?? '') : undefined);
      const emailVal = (dto.email as string | undefined)
        ?? (Array.isArray(dto.emails) && dto.emails[0] ? String((dto.emails[0] as { value?: unknown }).value ?? '') : undefined);
      const row = {
        title:              titleValue,                                          // NOT NULL
        status_description: lifecycle,
        status_id:          toBitrixStatusId(lifecycle),
        source:             (dto.source as string | undefined) ?? (dto.sourceId as string | undefined) ?? null, // → source_description
        contact_name:       contactName,
        contact_phone:      phoneVal ?? null,
        contact_email:      emailVal ?? null,
        notes:              (dto.notes as string | undefined) ?? (dto.comments as string | undefined) ?? null,  // → comments
        manager_id:         Number(dto.assignedById ?? dto.assignedTo ?? createdBy) || null,                    // → assigned_to
        // Marketing-14 #59/#67: ofset/gofra/etiketka/flekso/blanka, validated by
        // LeadCreateSchema (crm-leads.controller.ts) when present. DB CHECK constraint
        // (crm_leads_product_type_check) is the last line of defense for any other caller.
        product_type:       (dto.productType as string | undefined) ?? null,
        // EP-MKT-102 (Marketing #80, Hudud+eksport belgisi): lid hududi + eksport/ichki belgisi.
        region:             (dto.region as string | undefined) ?? null,
        is_export:          Boolean(dto.isExport ?? dto.is_export ?? false),
      };
      const result = await db.insert(crmLeads).values(row as unknown as typeof crmLeads.$inferInsert).returning();
      return Ok(mapLeadRow(result[0] as Row, this.scoringService));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      // Map incoming (often camelCase) keys to the real def properties. A blind
      // .set(dto) dropped every non-property key (statusId/status/...) → empty SET →
      // "UPDATE crm_leads SET  WHERE id=$1" SQL error. Lifecycle → status_description;
      // status_id → mapped Bitrix coarse state (CHECK-safe).
      const setObj: Record<string, unknown> = {};
      const lifecycleRaw = (dto.status ?? dto.statusId ?? dto.stage_id) as string | undefined;
      if (lifecycleRaw != null) {
        // Canonical fine stage = LEAD_STAGES.stageId (uppercase). The board reads
        // status_description (exposed as statusId) for column placement → store it
        // verbatim/uppercase so the dragged stage persists and the card stays put.
        const stage = String(lifecycleRaw).toUpperCase();
        setObj.status_description = stage;
        setObj.status_id = toBitrixStatusId(stage); // coarse Bitrix mirror (CHECK-safe)
      }
      if (dto.title != null) setObj.title = String(dto.title);
      if (dto.contact_name != null) setObj.contact_name = String(dto.contact_name);
      else {
        const nm = (dto.name ?? dto.firstName) as string | undefined;
        const ln = dto.lastName as string | undefined;
        if (nm != null || ln != null) setObj.contact_name = [nm, ln].filter(Boolean).join(' ');
      }
      if (dto.phone != null) setObj.contact_phone = String(dto.phone);
      if (dto.email != null) setObj.contact_email = String(dto.email);
      if (dto.source != null || dto.sourceId != null) setObj.source = String(dto.source ?? dto.sourceId);
      if (dto.notes != null || dto.comments != null) setObj.notes = String(dto.notes ?? dto.comments);
      if (dto.assignedById != null || dto.assignedTo != null) setObj.manager_id = Number(dto.assignedById ?? dto.assignedTo) || null;
      // Marketing-14 #59/#67: allow correcting the product type post-creation (e.g. from
      // a lead-detail edit form once one exists) — CHECK constraint guards the DB value.
      if (dto.productType != null) setObj.product_type = String(dto.productType);
      // EP-MKT-102 (Marketing #80, Hudud+eksport belgisi): lid hududi + eksport/ichki belgisi.
      if (dto.region != null) setObj.region = String(dto.region);
      if (dto.isExport != null || dto.is_export != null) setObj.is_export = Boolean(dto.isExport ?? dto.is_export);
      setObj.updated_at = _time.now();
      const result = await db.update(crmLeads).set(setObj as Partial<typeof crmLeads.$inferInsert>).where(eq(crmLeads.id, id)).returning();
      return Ok(result[0] ? mapLeadRow(result[0] as Row, this.scoringService) : {} as Row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(crmLeads).set({ deleted_at: _time.now() }).where(eq(crmLeads.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }

  // A3: log an outbound lead email as a REAL activity (no mail provider is configured, so this
  // is an honest "queued/logged" record — NOT a fake sent:true). sd_lead_activities is the
  // shared lead-activity log (lead_id -> crm_leads.id post-merge); real columns: type, note, manager_id.
  async logEmail(leadId: number, subject: string, body: string, managerId: number | null): Promise<Result<Row>> {
    try {
      const note = `Email — Subject: ${subject}${body ? ` — ${body.slice(0, 1000)}` : ''}`;
      const r = await db.execute(sql`
        INSERT INTO sd_lead_activities (lead_id, type, note, manager_id, created_at)
        VALUES (${leadId}, 'email', ${note}, ${managerId}, NOW())
        RETURNING id`);
      const activityId = ((r as { rows?: Row[] }).rows?.[0]?.id) ?? null;
      return Ok({ leadId, subject, queued: true, activityId });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Email logini saqlashda xatolik'); }
  }
}
