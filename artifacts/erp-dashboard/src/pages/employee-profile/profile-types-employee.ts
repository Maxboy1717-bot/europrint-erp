/**
 * @module profile-types-employee
 * @description Core employee identity, attendance, and discipline interfaces.
 * Split from profile-types.ts (Rule 16).
 */

import type { Employee } from '@/types/shared';
export type { Employee };

export interface PassportData {
  id: number;
  userId: number;
  passportNumber: string;
  passportSeries: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  birthPlace: string;
  citizenship: string;
}

export interface BankAccount {
  id: number;
  userId: number;
  bankName: string;
  accountNumber: string;
  cardNumber: string;
  cardHolderName: string;
  mfo: string;
  inn: string;
  isPrimary: boolean;
}

export interface EmergencyContact {
  id: number;
  userId: number;
  contactName: string;
  relationship: string;
  phoneNumber: string;
  alternativePhone: string;
  address: string;
  isPrimary: boolean;
}

export type { AttendanceRecord } from '@/types/hr';

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  sick: number;
  leave: number;
  punctualPercentage: number;
  totalMinutesLate: number;
}

export interface DisciplineRecord {
  id: number;
  userId: number;
  type: string;
  reason: string;
  amount: number;
  givenByName: string;
  createdAt: string;
}

export interface DisciplineStats {
  warnings: number;
  penalties: number;
  rewards: number;
  totalPenaltyAmount: number;
  totalRewardAmount: number;
}
