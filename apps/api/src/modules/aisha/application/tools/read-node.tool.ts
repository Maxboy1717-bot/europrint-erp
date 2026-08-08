/**
 * @module read-node.tool
 * @description Bilim grafidan bitta node + uning 1-qadam qo'shnilarini
 * o'qiydi, row-level RBAC bilan.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { KNOWLEDGE_GRAPH_REPO, type IKnowledgeGraphRepository, type KgNode, type KgEdge } from '../../../knowledge-graph/domain/repositories/i-knowledge-graph.repository';
import { ENTITY_TYPE_ROLE_MAP, ALL_ENTITY_TYPES } from '../../../knowledge-graph/domain/constants/entity-role-map';
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { provSource, provResult, hasAishaRole } from './_helpers';

export interface NodeWithEdges {
  node:  KgNode | null;
  edges: KgEdge[];
}

@Injectable()
export class ReadNodeTool implements IAishaTool {
  readonly definition = {
    name: 'read_node',
    description: 'Bilim grafidagi bitta entity (node) va uning aloqalarini o\'qiydi.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityType: { type: 'string', description: "masalan 'sales_order'" },
        entityId:   { type: 'string', description: 'entity ID' },
      },
      required: ['entityType', 'entityId'],
    },
  };

  constructor(@Inject(KNOWLEDGE_GRAPH_REPO) private readonly repo: IKnowledgeGraphRepository) {}

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<NodeWithEdges>>> {
    const entityType = String(input['entityType'] ?? '').trim();
    const entityId = String(input['entityId'] ?? '').trim();
    if (!entityType || !entityId) return Err(AppErr('VALIDATION', "'entityType' va 'entityId' majburiy"));

    const need = ENTITY_TYPE_ROLE_MAP[entityType];
    const allowed = need === null || need === undefined || hasAishaRole(ctx?.role, need);
    if (!allowed) return Err(AppErr('FORBIDDEN', "Ushbu entity-turini ko'rishga ruxsatingiz yo'q"));

    const allowedTypes = ALL_ENTITY_TYPES.filter((t) => {
      const r = ENTITY_TYPE_ROLE_MAP[t];
      return r === null || r === undefined || hasAishaRole(ctx?.role, r);
    });

    return safeCall(async () => {
      const start = Date.now();
      const nodeResult = await this.repo.getNode(entityType, entityId, allowedTypes);
      if (!nodeResult.ok) throw new Error(nodeResult.error.message);
      const edgesResult = await this.repo.getEdgesForNode(entityType, entityId, allowedTypes);
      if (!edgesResult.ok) throw new Error(edgesResult.error.message);
      return provResult<NodeWithEdges>({
        data: { node: nodeResult.data, edges: edgesResult.data },
        sources: [provSource({ type: 'database', identifier: 'kg_nodes+kg_edges', startMs: start, rowCount: edgesResult.data.length + (nodeResult.data ? 1 : 0) })],
      });
    });
  }
}
