import { z } from 'zod';

export const GetEmployeesDtoSchema = z.object({
  department: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'terminated', 'inactive']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetPayrollDtoSchema = z.object({
  employeeId: z.string().uuid().optional(),
  period: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'paid']).optional(),
});

export const GetAttendanceDtoSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
});

export type GetEmployeesDto = z.infer<typeof GetEmployeesDtoSchema>;
export type GetPayrollDto = z.infer<typeof GetPayrollDtoSchema>;
export type GetAttendanceDto = z.infer<typeof GetAttendanceDtoSchema>;
