/**
 * @module node-portret.repository
 * @description Repository / data-access layer for the org-node "Portret"
 *   (lavozim kartochkasi) wizard + its HR requests. Wraps Drizzle ORM queries;
 *   returns Result<T>. Tables created lazily via @common/database/ddl-migrations.
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { org_node_portret, node_hr_requests, appUsers } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { ensureOrgNodePortretTable, ensureNodeHrRequestsTable } from '@common/database/ddl-migrations';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

// NULLIF(TRIM(...)) → null when the user has no name parts (keeps creator_name nullable per FE type).
const creatorName = sql<string>`NULLIF(TRIM(COALESCE(${appUsers.first_name}, '') || ' ' || COALESCE(${appUsers.last_name}, '')), '')`;

export interface HrRequestInput {
  requestType?: string;
  priority?: string;
  comment?: string | null;
  portretId?: number | null;
  nodeName?: string | null;
}

@Injectable()
export class NodePortretRepository {
  async ensureTables(): Promise<void> {
    // org_node_portret first — node_hr_requests has a FK to it.
    await ensureOrgNodePortretTable();
    await ensureNodeHrRequestsTable();
  }

  // ─── Portret ───────────────────────────────────────────────────────────────

  async getPortret(nodeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:           org_node_portret.id,
        node_id:      org_node_portret.node_id,
        portret_data: org_node_portret.portret_data,
        creator_id:   org_node_portret.creator_id,
        creator_name: creatorName,
        created_at:   org_node_portret.created_at,
        updated_at:   org_node_portret.updated_at,
      }).from(org_node_portret)
        .leftJoin(appUsers, eq(appUsers.id, org_node_portret.creator_id))
        .where(eq(org_node_portret.node_id, nodeId))
        .limit(1);
      return (rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async upsertPortret(
    nodeId: number,
    portretData: Record<string, unknown>,
    creatorId: number | null,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(org_node_portret).values({
        node_id:      nodeId,
        portret_data: portretData,
        creator_id:   creatorId,
      }).onConflictDoUpdate({
        target: org_node_portret.node_id,
        set: {
          portret_data: portretData,
          creator_id:   creatorId,
          updated_at:   sql`NOW()`,
        },
      }).returning({
        id:           org_node_portret.id,
        node_id:      org_node_portret.node_id,
        portret_data: org_node_portret.portret_data,
        creator_id:   org_node_portret.creator_id,
        created_at:   org_node_portret.created_at,
        updated_at:   org_node_portret.updated_at,
      });
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }

  // ─── HR Requests ─────────────────────────────────────────────────────────────

  async getHrRequests(nodeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:             node_hr_requests.id,
        node_id:        node_hr_requests.node_id,
        portret_id:     node_hr_requests.portret_id,
        request_type:   node_hr_requests.request_type,
        priority:       node_hr_requests.priority,
        status:         node_hr_requests.status,
        comment:        node_hr_requests.comment,
        node_name:      node_hr_requests.node_name,
        requester_id:   node_hr_requests.requester_id,
        requester_name: creatorName,
        created_at:     node_hr_requests.created_at,
      }).from(node_hr_requests)
        .leftJoin(appUsers, eq(appUsers.id, node_hr_requests.requester_id))
        .where(eq(node_hr_requests.node_id, nodeId))
        .orderBy(sql`${node_hr_requests.created_at} DESC`);
      return rows as Row[];
    }, 'DB_ERROR');
  }

  async createHrRequest(
    nodeId: number,
    dto: HrRequestInput,
    requesterId: number | null,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(node_hr_requests).values({
        node_id:      nodeId,
        portret_id:   dto.portretId ?? null,
        request_type: dto.requestType ?? 'new_hire',
        priority:     dto.priority ?? 'normal',
        comment:      dto.comment ?? null,
        node_name:    dto.nodeName ?? null,
        requester_id: requesterId,
      }).returning({
        id:           node_hr_requests.id,
        node_id:      node_hr_requests.node_id,
        portret_id:   node_hr_requests.portret_id,
        request_type: node_hr_requests.request_type,
        priority:     node_hr_requests.priority,
        status:       node_hr_requests.status,
        comment:      node_hr_requests.comment,
        node_name:    node_hr_requests.node_name,
        requester_id: node_hr_requests.requester_id,
        created_at:   node_hr_requests.created_at,
      });
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }

  // ─── Portret PDF / Email ─────────────────────────────────────────────────────

  /**
   * Karta (org_departments — kanonik "node=karta" jadval, MASSIV-100) + razryad
   * ma'lumotlarini o'qiydi: lavozim nomi, ЦКП target, oylik vilkasi, razryad.
   * razryad_levels — ixtiyoriy FK (razryad_level_id NULL bo'lishi mumkin), shuning
   * uchun LEFT JOIN. org_departments/razryad_levels — poydevor jadvallar (ensureTables
   * shart emas, org_node_portret/node_hr_requests dan farqli — ular boot'da mavjud).
   */
  async getNodeCardInfo(nodeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          d.id, d.name, d.name_ru, d.description, d.node_type, d.parent_id,
          d.tskp, d.tskp_ru, d.tskp_target, d.tskp_measurement_unit,
          d.salary_type, d.min_salary, d.max_salary, d.razryad_level_id,
          p.name AS parent_name,
          r.level AS razryad_level, r.name AS razryad_name,
          r.min_requirement AS razryad_min_requirement
        FROM org_departments d
        LEFT JOIN org_departments p ON p.id = d.parent_id
        LEFT JOIN razryad_levels r ON r.id = d.razryad_level_id
        WHERE d.id = ${nodeId}
        LIMIT 1
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  /**
   * Portret PDF/email qabul qiluvchilar ro'yxati: faol HR menejerlar (role
   * hr/hr_manager) + shu kartaga biriktirilgan xodim(lar) (employee_org_departments,
   * is_active=true). Email bo'sh yoki foydalanuvchi soft-delete bo'lsa chiqarib
   * tashlanadi; DISTINCT — HR bo'lib, shu kartaga ham biriktirilgan xodim ikki marta
   * kelmaydi.
   */
  async getPortretRecipientEmails(nodeId: number): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ email: string }>(sql`
        SELECT DISTINCT email FROM (
          SELECT email FROM users
          WHERE role IN ('hr', 'hr_manager') AND is_active = true
            AND deleted_at IS NULL AND email IS NOT NULL
          UNION
          SELECT u.email FROM employee_org_departments eod
          JOIN users u ON u.id = eod.user_id
          WHERE eod.org_department_id = ${nodeId} AND eod.is_active = true
            AND u.email IS NOT NULL AND u.deleted_at IS NULL
        ) recipients
      `);
      return rows.rows.map((r) => r.email);
    }, 'DB_ERROR');
  }
}
