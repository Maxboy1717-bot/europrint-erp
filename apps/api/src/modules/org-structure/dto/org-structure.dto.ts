import { z } from 'zod';

export const OrgCreateNodeSchema = z.object({
  name:      z.string().min(1).max(255),
  type:      z.enum(['department', 'position', 'division', 'team', 'group']).optional(),
  parent_id: z.string().optional(),
  code:      z.string().max(50).optional(),
});
export type OrgCreateNodeDto = z.infer<typeof OrgCreateNodeSchema>;

export const OrgUpdateNodeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['department', 'position', 'division', 'team', 'group']).optional(),
  code: z.string().max(50).optional(),
});
export type OrgUpdateNodeDto = z.infer<typeof OrgUpdateNodeSchema>;

export const OrgMoveNodeSchema = z.object({
  parent_id: z.string().min(1),
});
export type OrgMoveNodeDto = z.infer<typeof OrgMoveNodeSchema>;

export const OrgAssignUserNodeSchema = z.object({
  node_id: z.string().min(1),
});
export type OrgAssignUserNodeDto = z.infer<typeof OrgAssignUserNodeSchema>;

export const OrgCreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(50).optional(),
});
export type OrgCreateFolderDto = z.infer<typeof OrgCreateFolderSchema>;
