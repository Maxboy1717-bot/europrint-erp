import { z } from 'zod';

export const LmsCreateCourseSchema = z.object({
  title:        z.string().min(1).max(255),
  description:  z.string().optional(),
  category:     z.string().max(100).optional(),
  isMandatory:  z.boolean().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  durationDays: z.number().int().positive().optional(),
});
export type LmsCreateCourseDto = z.infer<typeof LmsCreateCourseSchema>;

export const LmsEnrollEmployeeSchema = z.object({
  employeeId:  z.number().int().positive(),
  courseId:    z.number().int().positive(),
  courseName:  z.string().optional(),
  dueDate:     z.string().optional(),
});
export type LmsEnrollEmployeeDto = z.infer<typeof LmsEnrollEmployeeSchema>;

export const LmsUpdateProgressSchema = z.object({
  progressPercent: z.number().min(0).max(100),
  status:          z.enum(['not_started', 'in_progress', 'completed']).optional(),
  lastAccessedAt:  z.string().optional(),
});
export type LmsUpdateProgressDto = z.infer<typeof LmsUpdateProgressSchema>;

export const LmsIssueCertificateSchema = z.object({
  employeeId:      z.number().int().positive(),
  courseId:        z.number().int().positive(),
  courseName:      z.string().optional(),
  validityMonths:  z.number().int().positive().optional(),
});
export type LmsIssueCertificateDto = z.infer<typeof LmsIssueCertificateSchema>;

export const LmsRevokeCertificateSchema = z.object({
  reason: z.string().min(1).max(500),
});
export type LmsRevokeCertificateDto = z.infer<typeof LmsRevokeCertificateSchema>;

export const LmsCheckMesSchema = z.object({
  employeeId:  z.number().int().positive().optional(),
  machineType: z.string().optional(),
});
export type LmsCheckMesDto = z.infer<typeof LmsCheckMesSchema>;

export const LmsCheckCertForMesSchema = z.object({
  employeeId: z.number().int().positive(),
  courseId:   z.number().int().positive(),
});
export type LmsCheckCertForMesDto = z.infer<typeof LmsCheckCertForMesSchema>;

export const LmsCompleteEnrollmentSchema = z.object({
  score: z.number().min(0).max(100).optional(),
});
export type LmsCompleteEnrollmentDto = z.infer<typeof LmsCompleteEnrollmentSchema>;
