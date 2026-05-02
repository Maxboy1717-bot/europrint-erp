import { z } from 'zod';

export const CreateLeaveRequestDtoSchema = z.object({
  employeeId: z.string().uuid('Employee ID must be a valid UUID'),
  leaveType: z.enum(['annual', 'sick', 'maternity', 'unpaid', 'study']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type CreateLeaveRequestDto = z.infer<
  typeof CreateLeaveRequestDtoSchema
>;

export const ApproveLeaveDtoSchema = z.object({
  notes: z.string().optional(),
});

export type ApproveLeaveDto = z.infer<typeof ApproveLeaveDtoSchema>;

export const RejectLeaveDtoSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type RejectLeaveDto = z.infer<typeof RejectLeaveDtoSchema>;

export const GetLeavesDtoSchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  leaveType: z.enum(['annual', 'sick', 'maternity', 'unpaid', 'study']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type GetLeavesDto = z.infer<typeof GetLeavesDtoSchema>;
