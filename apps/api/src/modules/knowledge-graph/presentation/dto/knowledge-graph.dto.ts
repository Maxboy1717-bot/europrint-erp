/**
 * @module knowledge-graph.dto
 * @description Zod validation schemas for the Knowledge Graph REST surface.
 */

import { z } from 'zod';

export const NodesQuerySchema = z.object({
  entityType: z.string().max(50).optional(),
  query:      z.string().max(200).optional(),
  limit:      z.coerce.number().int().min(1).max(100).default(50),
});
export type NodesQueryDto = z.infer<typeof NodesQuerySchema>;

export const EdgesQuerySchema = z.object({
  isBroken:   z.coerce.boolean().optional(),
  sourceType: z.string().max(50).optional(),
  sourceId:   z.string().max(64).optional(),
  limit:      z.coerce.number().int().min(1).max(100).default(50),
});
export type EdgesQueryDto = z.infer<typeof EdgesQuerySchema>;

export const SearchQuerySchema = z.object({
  query:      z.string().min(1).max(200),
  entityType: z.string().max(50).optional(),
  limit:      z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;

export const CreateLinkSchema = z.object({
  sourceType:   z.string().min(1).max(50),
  sourceId:     z.string().min(1).max(64),
  targetType:   z.string().min(1).max(50),
  targetId:     z.string().min(1).max(64),
  relationType: z.string().min(1).max(50),
});
export type CreateLinkDto = z.infer<typeof CreateLinkSchema>;
