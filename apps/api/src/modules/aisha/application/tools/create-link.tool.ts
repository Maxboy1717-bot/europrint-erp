/**
 * @module create-link.tool
 * @description Bilim grafida ikkita entity orasida yangi bog'lanish (edge)
 * yaratadi. MEDIUM-xavf (`assign-task.tool.ts` kabi — haqiqiy yozuv, lekin
 * pul/odam/tashqi-aloqaga tegmaydi) — HIGH_STAKE_TOOLS ro'yxatida emas.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { KNOWLEDGE_GRAPH_REPO, type IKnowledgeGraphRepository, type KgEdge } from '../../../knowledge-graph/domain/repositories/i-knowledge-graph.repository';
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';

@Injectable()
export class CreateLinkTool implements IAishaTool {
  readonly definition = {
    name: 'create_link',
    description: "MEDIUM: Bilim grafida ikkita entity orasida yangi mantiqiy bog'lanish yaratadi.",
    input_schema: {
      type: 'object' as const,
      properties: {
        sourceType:   { type: 'string' },
        sourceId:     { type: 'string' },
        targetType:   { type: 'string' },
        targetId:     { type: 'string' },
        relationType: { type: 'string', description: "masalan 'related_to', 'blocks', 'linked_document'" },
      },
      required: ['sourceType', 'sourceId', 'targetType', 'targetId', 'relationType'],
    },
  };

  readonly stakeLevel = 'medium' as const;

  constructor(@Inject(KNOWLEDGE_GRAPH_REPO) private readonly repo: IKnowledgeGraphRepository) {}

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<KgEdge>>> {
    const sourceType = String(input['sourceType'] ?? '').trim();
    const sourceId = String(input['sourceId'] ?? '').trim();
    const targetType = String(input['targetType'] ?? '').trim();
    const targetId = String(input['targetId'] ?? '').trim();
    const relationType = String(input['relationType'] ?? '').trim();
    if (!sourceType || !sourceId || !targetType || !targetId || !relationType) {
      return Err(AppErr('VALIDATION', "sourceType, sourceId, targetType, targetId, relationType — barchasi majburiy"));
    }

    return safeCall(async () => {
      const start = Date.now();
      const result = await this.repo.createManualLink({
        sourceType, sourceId, targetType, targetId, relationType,
        source: 'ai', createdBy: ctx?.userId ?? null,
      });
      if (!result.ok) throw new Error(result.error.message);
      return provResult<KgEdge>({
        data: result.data,
        sources: [provSource({ type: 'database', identifier: 'kg_edges', startMs: start, rowCount: 1 })],
        citations: [{ label: `${sourceType}:${sourceId} → ${targetType}:${targetId}` }],
      });
    });
  }
}
