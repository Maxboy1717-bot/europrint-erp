import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

export const ContextRoomSchema = z.object({
  contextType: z.string().trim().min(1, 'contextType majburiy'),
  contextId: z.string().trim().min(1, 'contextId majburiy'),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'moderator', 'member'], {
    errorMap: () => ({ message: "role 'admin', 'moderator' yoki 'member' bo'lishi kerak" }),
  }),
});

function parseSchema<T>(schema: z.ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) throw new BadRequestException(e.errors[0]?.message ?? 'Validation failed');
    throw e;
  }
}

export function parseContextRoom(body: unknown) { return parseSchema(ContextRoomSchema, body); }
export function parseUpdateMemberRole(body: unknown) { return parseSchema(UpdateMemberRoleSchema, body); }
