/**
 * @module drizzle-knowledge-graph.repository
 * @description ONLY place in this module allowed to call `db.*` (Qoida 15).
 * Row-level RBAC (`ListNodesFilter.allowedTypes`/`ListEdgesFilter.allowedTypes`)
 * is always computed by the CALLER (controller/tool, via
 * `domain/constants/entity-role-map.ts`) and applied here as a
 * `WHERE entity_type = ANY(allowedTypes)` filter — never trusted as-is from
 * the client, never recomputed here.
 */

import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { db, kg_nodes, kg_edges } from '@shared/db';
import { Result, Ok, Err, AppErr, safeCall } from '@common/result';
import type {
  IKnowledgeGraphRepository, KgNode, KgEdge, NodeUpsert, EdgeUpsert,
  ListNodesFilter, ListEdgesFilter,
} from '../../domain/repositories/i-knowledge-graph.repository';

function toKgNode(row: typeof kg_nodes.$inferSelect): KgNode {
  return {
    id:              row.id,
    entityType:      row.entity_type,
    entityId:        row.entity_id,
    title:           row.title,
    summary:         row.summary,
    metadata:        (row.metadata as Record<string, unknown>) ?? {},
    sourceUpdatedAt: row.source_updated_at ? row.source_updated_at.toISOString() : null,
    createdAt:       row.created_at.toISOString(),
    updatedAt:       row.updated_at.toISOString(),
  };
}

function toKgEdge(row: typeof kg_edges.$inferSelect): KgEdge {
  return {
    id:            row.id,
    sourceType:    row.source_type,
    sourceId:      row.source_id,
    targetType:    row.target_type,
    targetId:      row.target_id,
    relationType:  row.relation_type,
    weight:        Number(row.weight),
    isBroken:      row.is_broken,
    brokenReason:  row.broken_reason,
    source:        row.source as 'system' | 'manual' | 'ai',
    createdBy:     row.created_by,
    createdAt:     row.created_at.toISOString(),
    updatedAt:     row.updated_at.toISOString(),
  };
}

@Injectable()
export class DrizzleKnowledgeGraphRepository implements IKnowledgeGraphRepository {
  async upsertNode(input: NodeUpsert): Promise<Result<KgNode>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(kg_nodes)
        .values({
          entity_type:       input.entityType,
          entity_id:         input.entityId,
          title:             input.title,
          summary:           input.summary ?? null,
          metadata:          input.metadata ?? {},
          source_updated_at: input.sourceUpdatedAt ?? null,
          updated_at:        new Date(),
        })
        .onConflictDoUpdate({
          target: [kg_nodes.entity_type, kg_nodes.entity_id],
          set: {
            title:             input.title,
            summary:           input.summary ?? null,
            metadata:          input.metadata ?? {},
            source_updated_at: input.sourceUpdatedAt ?? null,
            updated_at:        new Date(),
          },
        })
        .returning();
      if (!row) throw new Error('kg_nodes upsert returned no row');
      return toKgNode(row);
    });
  }

  async upsertEdge(input: EdgeUpsert): Promise<Result<KgEdge>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(kg_edges)
        .values({
          source_type:   input.sourceType,
          source_id:     input.sourceId,
          target_type:   input.targetType,
          target_id:     input.targetId,
          relation_type: input.relationType,
          weight:        String(input.weight ?? 1),
          source:        input.source ?? 'system',
          created_by:    input.createdBy ?? null,
          updated_at:    new Date(),
        })
        .onConflictDoUpdate({
          target: [kg_edges.source_type, kg_edges.source_id, kg_edges.target_type, kg_edges.target_id, kg_edges.relation_type],
          set: { updated_at: new Date() },
        })
        .returning();
      if (!row) throw new Error('kg_edges upsert returned no row');
      return toKgEdge(row);
    });
  }

  async markEdgeBroken(input: {
    sourceType: string; sourceId: string; targetType: string; targetId: string; relationType: string; reason: string;
  }): Promise<Result<void>> {
    return safeCall(async () => {
      await db
        .update(kg_edges)
        .set({ is_broken: true, broken_reason: input.reason, updated_at: new Date() })
        .where(and(
          eq(kg_edges.source_type, input.sourceType),
          eq(kg_edges.source_id, input.sourceId),
          eq(kg_edges.target_type, input.targetType),
          eq(kg_edges.target_id, input.targetId),
          eq(kg_edges.relation_type, input.relationType),
        ));
    });
  }

  async listNodes(filter: ListNodesFilter): Promise<Result<KgNode[]>> {
    if (filter.allowedTypes.length === 0) return Ok([]);
    return safeCall(async () => {
      const conditions = [inArray(kg_nodes.entity_type, [...filter.allowedTypes])];
      if (filter.entityType) conditions.push(eq(kg_nodes.entity_type, filter.entityType));
      if (filter.query) {
        const q = `%${filter.query}%`;
        conditions.push(or(ilike(kg_nodes.title, q), ilike(kg_nodes.summary, q))!);
      }
      const rows = await db
        .select()
        .from(kg_nodes)
        .where(and(...conditions))
        .orderBy(desc(kg_nodes.updated_at))
        .limit(filter.limit);
      return rows.map(toKgNode);
    });
  }

  async listEdges(filter: ListEdgesFilter): Promise<Result<KgEdge[]>> {
    if (filter.allowedTypes.length === 0) return Ok([]);
    return safeCall(async () => {
      const conditions = [inArray(kg_edges.source_type, [...filter.allowedTypes])];
      if (filter.isBroken !== undefined) conditions.push(eq(kg_edges.is_broken, filter.isBroken));
      if (filter.sourceType) conditions.push(eq(kg_edges.source_type, filter.sourceType));
      if (filter.sourceId) conditions.push(eq(kg_edges.source_id, filter.sourceId));
      const rows = await db
        .select()
        .from(kg_edges)
        .where(and(...conditions))
        .orderBy(desc(kg_edges.updated_at))
        .limit(filter.limit);
      return rows.map(toKgEdge);
    });
  }

  async getNode(entityType: string, entityId: string, allowedTypes: readonly string[]): Promise<Result<KgNode | null>> {
    if (!allowedTypes.includes(entityType)) return Ok(null);
    return safeCall(async () => {
      const [row] = await db
        .select()
        .from(kg_nodes)
        .where(and(eq(kg_nodes.entity_type, entityType), eq(kg_nodes.entity_id, entityId)))
        .limit(1);
      return row ? toKgNode(row) : null;
    });
  }

  async getEdgesForNode(entityType: string, entityId: string, allowedTypes: readonly string[]): Promise<Result<KgEdge[]>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(kg_edges)
        .where(or(
          and(eq(kg_edges.source_type, entityType), eq(kg_edges.source_id, entityId)),
          and(eq(kg_edges.target_type, entityType), eq(kg_edges.target_id, entityId)),
        ));
      return rows
        .filter((r) => allowedTypes.includes(r.source_type) && allowedTypes.includes(r.target_type))
        .map(toKgEdge);
    });
  }

  async createManualLink(input: EdgeUpsert): Promise<Result<KgEdge>> {
    if (input.sourceType === input.targetType && input.sourceId === input.targetId) {
      return Err(AppErr('VALIDATION', "O'z-o'ziga bog'lanish yaratib bo'lmaydi"));
    }
    return this.upsertEdge({ ...input, source: input.source ?? 'manual' });
  }
}
