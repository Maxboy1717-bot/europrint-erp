/** @module ApplicationsTypes @description TypeScript interfaces, types, and Zod schemas for the Applications page. No JSX. */

import { z } from "zod";

export interface ApplicationQuestion {
  id: string;
  question: string;
  questionRu: string;
  type: "text" | "choice";
  required: boolean;
  options?: string[];
}

export interface Application {
  id: string;
  title: string;
  titleRu: string | null;
  description: string | null;
  descriptionRu: string | null;
  questions: ApplicationQuestion[];
  isActive: boolean;
  createdAt: string;
}

export interface ApplicationResponse {
  id: string;
  applicationId: string;
  userId: string;
  answers: { questionId: string; answer: string }[];
  status: "pending" | "approved" | "rejected";
  assignedTo: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  response: string | null;
  submittedAt: string;
}

export interface Department {
  id: string;
  name: string;
  nameRu: string;
}

export interface Position {
  id: string;
  name: string;
  nameRu: string;
}

export interface UserStub {
  id: string;
  fullName: string;
  employeeId: string;
}

export const applicationSchema = z.object({
  title: z.string().min(1, "Ariza nomini kiriting"),
  questions: z.array(z.unknown()).min(1, "Kamida bitta savol qo'shish majburiy"),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export interface UpdateResponsePayload {
  id: string;
  status?: string;
  notes?: string;
  response?: string;
  assignedTo?: string | null;
}
