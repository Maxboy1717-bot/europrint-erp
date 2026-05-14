/**
 * @module drizzle-sd-customers/contacts-nps.repo
 * @description Pure stateless helper functions used by DrizzleSdCustomersRepository
 *   for contact, NPS, document, interaction, competitor and complaint operations.
 *   These are kept as functions (not @Injectable) so the parent repo's DI contract
 *   stays unchanged.
 */

import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  execSdContactDelete, execSdDocumentDelete, execSdCompetitorDelete,
} from '@common/database/queries-sd';

type Row = Record<string, unknown>;

export async function getContacts(cid: number): Promise<Row[]> {
  const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_contacts WHERE customer_id = ${cid} ORDER BY is_primary DESC, full_name`);
  return rows.rows as Row[];
}

export async function addContact(cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, is_primary: unknown, extras?: Record<string, unknown>): Promise<Row> {
  const influence = extras?.influence_level ?? 3;
  const isDm = extras?.is_decision_maker ?? false;
  const dept = extras?.department ?? null;
  const linkedin = extras?.linkedin_url ?? null;
  const roleNote = extras?.role_note ?? null;
  const telegram = extras?.telegram ?? null;
  const rows = await runQuery<Row>(sql`
    INSERT INTO sd_customer_contacts
      (customer_id, full_name, phone, email, position, is_primary, influence_level, is_decision_maker, department, linkedin_url, role_note, telegram)
    VALUES
      (${cid}, ${full_name}, ${phone ?? null}, ${email ?? null}, ${position ?? null}, ${is_primary ?? false},
       ${influence}, ${isDm}, ${dept}, ${linkedin}, ${roleNote}, ${telegram})
    RETURNING *
  `);
  return (rows.rows[0] ?? {}) as Row;
}

export async function updateContact(kid: number, cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, extras?: Record<string, unknown>): Promise<Row[]> {
  const influence = extras?.influence_level ?? null;
  const isDm = extras?.is_decision_maker ?? null;
  const dept = extras?.department ?? null;
  const linkedin = extras?.linkedin_url ?? null;
  const roleNote = extras?.role_note ?? null;
  const telegram = extras?.telegram ?? null;
  const rows = await runQuery<Row>(sql`
    UPDATE sd_customer_contacts SET
      full_name         = COALESCE(${full_name ?? null}, full_name),
      phone             = COALESCE(${phone ?? null}, phone),
      email             = COALESCE(${email ?? null}, email),
      position          = COALESCE(${position ?? null}, position),
      telegram          = COALESCE(${telegram}, telegram),
      influence_level   = COALESCE(${influence}, influence_level),
      is_decision_maker = COALESCE(${isDm}, is_decision_maker),
      department        = COALESCE(${dept}, department),
      linkedin_url      = COALESCE(${linkedin}, linkedin_url),
      role_note         = COALESCE(${roleNote}, role_note),
      updated_at        = NOW()
    WHERE id = ${kid} AND customer_id = ${cid} RETURNING *
  `);
  return rows.rows as Row[];
}

export async function deleteContact(kid: number, cid: number): Promise<void> { await execSdContactDelete(kid, cid); }

export async function getNps(cid: number): Promise<Row[]> {
  const rows = await runQuery<Row>(sql`
    SELECT *, CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
    FROM nps_responses WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 30
  `);
  return rows.rows as Row[];
}

export async function addNps(cid: number, score: number, comment: unknown): Promise<Row> {
  const id = `nps-${cid}-${Date.now()}`;
  const rows = await runQuery<Row>(sql`
    INSERT INTO nps_responses (id, customer_id, score, comment, created_at)
    VALUES (${id}, ${cid}, ${score}, ${comment ?? null}, NOW())
    RETURNING *, CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
  `);
  return (rows.rows[0] ?? {}) as Row;
}

export async function getInteractions(cid: number): Promise<Row[]> {
  const rows = await runQuery<Row>(sql`
    SELECT i.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name
    FROM sd_customer_interactions i LEFT JOIN employees e ON e.id::text = i.employee_id::text
    WHERE i.customer_id = ${cid} ORDER BY i.created_at DESC LIMIT 20
  `);
  return rows.rows as Row[];
}

export async function addInteraction(cid: number, type: unknown, notes: unknown, employee_id: unknown): Promise<Row> {
  const rows = await runQuery<Row>(sql`
    INSERT INTO sd_customer_interactions (customer_id, type, notes, employee_id)
    VALUES (${cid}, ${type}, ${notes ?? null}, ${employee_id ?? null}) RETURNING *
  `);
  return (rows.rows[0] ?? {}) as Row;
}

export async function getDocuments(cid: number): Promise<Row[]> {
  const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC`);
  return rows.rows as Row[];
}

export async function addDocument(cid: number, type: unknown, name: unknown, url: unknown, notes: unknown): Promise<Row> {
  const rows = await runQuery<Row>(sql`
    INSERT INTO sd_customer_documents (customer_id, type, name, url, notes)
    VALUES (${cid}, ${type}, ${name}, ${url ?? null}, ${notes ?? null}) RETURNING *
  `);
  return (rows.rows[0] ?? {}) as Row;
}

export async function deleteDocument(cid: number, did: number): Promise<void> { await execSdDocumentDelete(did, cid); }

export async function getCompetitors(cid: number): Promise<Row[]> {
  const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid} ORDER BY competitor_name`);
  return rows.rows as Row[];
}

export async function addCompetitor(cid: number, competitorName: unknown, notes: unknown, productType?: unknown, estimatedSharePct?: unknown, winBackPotential?: unknown): Promise<Row> {
  const rows = await runQuery<Row>(sql`
    INSERT INTO sd_customer_competitors (customer_id, competitor_name, notes, product_type, estimated_share_pct, win_back_potential)
    VALUES (${cid}, ${competitorName ?? null}, ${notes ?? null}, ${productType ?? null}, ${estimatedSharePct ?? null}, ${winBackPotential ?? null})
    RETURNING *
  `);
  return (rows.rows[0] ?? {}) as Row;
}

export async function deleteCompetitor(customerId: number, competitorId: number): Promise<void> { await execSdCompetitorDelete(competitorId, customerId); }

export async function getComplaints(cid: number): Promise<Row[]> {
  const rows = await runQuery<Row>(sql`
    SELECT cp.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS resolved_by_name
    FROM sd_customer_complaints cp LEFT JOIN employees e ON e.id = cp.resolved_by
    WHERE cp.customer_id = ${cid} ORDER BY cp.created_at DESC
  `);
  return rows.rows as Row[];
}

export async function resolveComplaint(customerId: number, complaintId: number, resolution: string, resolvedBy: number | null): Promise<Row | null> {
  const rows = await runQuery<Row>(sql`
    UPDATE sd_customer_complaints SET status = 'resolved', resolution = ${resolution}, resolved_by = ${resolvedBy}, resolved_at = NOW()
    WHERE id = ${complaintId} AND customer_id = ${customerId} RETURNING *
  `);
  return (rows.rows[0] ?? null) as Row | null;
}

export async function updateInternalNotes(cid: number, body: Record<string, unknown>): Promise<Row[]> {
  const rq = body.relationship_quality ?? null;
  const notes = body.internal_notes ?? null;
  const shareOfWallet = body.share_of_wallet ?? null;
  const rows = await runQuery<Row>(sql`
    UPDATE sd_customers SET
      relationship_quality = COALESCE(${rq}, relationship_quality),
      notes               = COALESCE(${notes}, notes),
      share_of_wallet     = COALESCE(${shareOfWallet}, share_of_wallet),
      updated_at          = NOW()
    WHERE id = ${cid} RETURNING *
  `);
  return rows.rows as Row[];
}
