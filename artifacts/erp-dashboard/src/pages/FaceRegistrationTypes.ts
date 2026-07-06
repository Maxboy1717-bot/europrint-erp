/** @module FaceRegistrationTypes @description Shared TypeScript interfaces and type aliases for the FaceRegistration feature. No JSX. Translations moved to i18n "iot" namespace under the "FaceReg." key prefix. */

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  profileImageUrl: string | null;
}

export interface FaceEmbedding {
  id: string;
  employeeId: string;
  employeeName: string;
  imageUrl: string | null;
  isActive: boolean;
  confidence: number;
  createdAt: string;
}

export interface RegisterFacePayload {
  employeeId: string;
  embedding: number[];
  imageUrl: string;
  confidence: number;
  images?: string[];
}

// ---------------------------------------------------------------------------
// Liveness status
// ---------------------------------------------------------------------------

export type LivenessStatus = 'idle' | 'challenging' | 'passed' | 'failed';

