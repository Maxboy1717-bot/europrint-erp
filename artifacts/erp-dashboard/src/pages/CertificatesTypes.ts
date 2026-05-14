/**
 * @module CertificatesTypes
 * @description Types for Certificates page.
 */

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  score: number | null;
  bonusAmount: number | null;
  issuedAt: string;
  expiresAt: string | null;
  userName: string;
  userEmployeeId: string;
  courseName: string;
  courseCode: string;
}

export interface User {
  id: string;
  fullName: string;
  employeeId: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
}
