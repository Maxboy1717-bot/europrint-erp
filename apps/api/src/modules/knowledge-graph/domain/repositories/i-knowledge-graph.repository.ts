/**
 * @module i-knowledge-graph.repository
 * @description Port for the Knowledge Graph persistence layer. Every method
 * returns `Result<T>` (Qoida 1); the concrete Drizzle implementation is the
 * ONLY place allowed to call `db.*` (Qoida 15).
 */

import type { Result } from '@common/result';

export interface KgNode {
  id:              string;
  entityType:      string;
  entityId:        string;
  title:           string;
  summary:         string | null;
  metadata:        Record<string, unknown>;
  sourceUpdatedAt: string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface KgEdge {
  id:            string;
  sourceType:    string;
  sourceId:      string;
  targetType:    string;
  targetId:      string;
  relationType:  string;
  weight:        number;
  isBroken:      boolean;
  brokenReason:  string | null;
  source:        'system' | 'manual' | 'ai';
  createdBy:     number | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface NodeUpsert {
  entityType:      string;
  entityId:        string;
  title:           string;
  summary?:        string | null;
  metadata?:       Record<string, unknown>;
  sourceUpdatedAt?: Date;
}

export interface EdgeUpsert {
  sourceType:   string;
  sourceId:     string;
  targetType:   string;
  targetId:     string;
  relationType: string;
  weight?:      number;
  source?:      'system' | 'manual' | 'ai';
  createdBy?:   number | null;
}

export interface ListNodesFilter {
  entityType?:    string;
  allowedTypes:   readonly string[]; // row-level RBAC, computed by the caller
  query?:         string;
  limit:          number;
  cursor?:        string;
}

export interface ListEdgesFilter {
  isBroken?:   boolean;
  sourceType?: string;
  sourceId?:   string;
  allowedTypes: readonly string[];
  limit:       number;
}

export interface IKnowledgeGraphRepository {
  upsertNode(input: NodeUpsert): Promise<Result<KgNode>>;
  upsertEdge(input: EdgeUpsert): Promise<Result<KgEdge>>;
  markEdgeBroken(input: { sourceType: string; sourceId: string; targetType: string; targetId: string; relationType: string; reason: string }): Promise<Result<void>>;
  listNodes(filter: ListNodesFilter): Promise<Result<KgNode[]>>;
  listEdges(filter: ListEdgesFilter): Promise<Result<KgEdge[]>>;
  getNode(entityType: string, entityId: string, allowedTypes: readonly string[]): Promise<Result<KgNode | null>>;
  getEdgesForNode(entityType: string, entityId: string, allowedTypes: readonly string[]): Promise<Result<KgEdge[]>>;
  createManualLink(input: EdgeUpsert): Promise<Result<KgEdge>>;
}

export const KNOWLEDGE_GRAPH_REPO = Symbol('KNOWLEDGE_GRAPH_REPO');
