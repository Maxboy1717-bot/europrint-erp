/**
 * @module search-graph.tool
 * @description AI Bilim Grafigi bo'ylab qidiruv. Row-level RBAC — bir xil
 * `ENTITY_TYPE_ROLE_MAP` siyosati REST endpoint (`knowledge-graph.controller.ts`)
 * bilan bitta manbadan olinadi, natija ruxsatsiz entity-turlarni sokin
 * chiqarib tashlaydi (403 emas).
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { KNOWLEDGE_GRAPH_REPO, type IKnowledgeGraphRepository } from '../../../knowledge-graph/domain/repositories/i-knowledge-graph.repository';
import { ENTITY_TYPE_ROLE_MAP, ALL_ENTITY_TYPES } from '../../../knowledge-graph/domain/constants/entity-role-map';
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { provSource, provResult, hasAishaRole } from './_helpers';

export interface GraphSearchHit {
  entityType: string;
  entityId:   string;
  title:      string;
  summary:    string | null;
}

@Injectable()
export class SearchGraphTool implements IAishaTool {
  readonly definition = {
    name: 'search_graph',
    description: "Bilim grafi bo'ylab qidiruv (mijoz, buyurtma, ishlab chiqarish, hujjat, ...).",
    input_schema: {
      type: 'object' as const,
      properties: {
        query:      { type: 'string', description: 'Qidiruv matni' },
        entityType: { type: 'string', description: "Ixtiyoriy: 'customer'|'sales_order'|'production_order'|'document'|..." },
        limit:      { type: 'number', description: '1-50, default 20' },
      },
      required: ['query'],
    },
  };

  constructor(@Inject(KNOWLEDGE_GRAPH_REPO) private readonly repo: IKnowledgeGraphRepository) {}

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<GraphSearchHit[]>>> {
    const query = String(input['query'] ?? '').trim();
    if (!query) return Err(AppErr('VALIDATION', "'query' majburiy"));
    const entityType = typeof input['entityType'] === 'string' ? input['entityType'] : undefined;
    const limit = Math.max(1, Math.min(50, Number(input['limit'] ?? 20) || 20));

    const candidates = entityType ? [entityType] : ALL_ENTITY_TYPES;
    const allowedTypes = candidates.filter((t) => {
      const need = ENTITY_TYPE_ROLE_MAP[t];
      return need === null || need === undefined || hasAishaRole(ctx?.role, need);
    });

    return safeCall(async () => {
      const start = Date.now();
      const result = await this.repo.listNodes({ entityType, query, limit, allowedTypes });
      if (!result.ok) throw new Error(result.error.message);
      const hits: GraphSearchHit[] = result.data.map((n) => ({
        entityType: n.entityType, entityId: n.entityId, title: n.title, summary: n.summary,
      }));
      return provResult<GraphSearchHit[]>({
        data: hits,
        sources: [provSource({ type: 'database', identifier: 'kg_nodes', startMs: start, rowCount: hits.length })],
      });
    });
  }
}
