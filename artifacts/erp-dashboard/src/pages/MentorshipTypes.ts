/**
 * @module MentorshipTypes
 * @description Types, interfaces and Zod schema for Mentorship.
 */

import { z } from "zod";

export interface MentorshipRecord {
  id: string;
  mentorId: string;
  menteeId: string;
  courseId: string;
  deadline: string;
  bonusPercentage: number;
  status: string;
  notes?: string;
  mentorName?: string;
  mentorEmployeeId?: string;
  menteeName?: string;
  menteeEmployeeId?: string;
  courseTitle?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
}

export interface Course {
  id: string;
  title: string;
}

export const mentorshipFormSchema = z.object({
  mentorId: z.string().min(1, "Mentor talab qilinadi"),
  menteeId: z.string().min(1, "Mentee talab qilinadi"),
  courseId: z.string().min(1, "Kurs talab qilinadi"),
  deadline: z.string().min(1, "Muddat talab qilinadi"),
  bonusPercentage: z.number().min(0).max(100, "Bonus 0-100% oralig'ida bo'lishi kerak"),
  status: z.string().default("active"),
  notes: z.string().optional(),
});

export type MentorshipFormValues = z.infer<typeof mentorshipFormSchema>;
