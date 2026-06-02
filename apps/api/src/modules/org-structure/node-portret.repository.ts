/**
 * @module node-portret.repository
 * @description Repository / data-access layer for the org-node "Portret"
 *   (lavozim kartochkasi) wizard + its HR requests. Wraps Drizzle ORM queries;
 *   returns Result<T>. Tables created lazily via @common/database/ddl-migrations.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
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
}
