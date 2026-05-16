/**
 * @module InspectionPageTypes
 * @description Types, constants, and utilities for InspectionPage.
 */

import { apiRequest } from '@/lib/queryClient';

import { tLabel } from '@/lib/i18n/tLabel';
export interface RoomRow {
  room_code:          string;
  room_name:          string;
  photo_url?:         string;
  description?:       string;
  cleanliness_score?: number;
  order_score?:       number;
  equipment_ok?:      boolean;
  anomalies?:         { type: string; description: string; severity: string }[];
  analyzed_at?:       string;
  current_photo_url?: string;
}

export interface AlertRow {
  id:                string;
  room_code:         string;
  cleanliness_score: number;
  order_score:       number;
  equipment_ok:      boolean;
  anomalies:         { type: string; description: string; severity: string }[];
  analyzed_at:       string;
}

export interface HistoryRow {
  analyzed_at:       string;
  cleanliness_score: number;
  order_score:       number;
  equipment_ok:      boolean;
}

export const ROOMS = [
  { code: 'OFFSET',    name: 'Ofset bosma' },
  { code: 'FLEXO',     name: 'Fleksografiya' },
  { code: 'PREPRESS',  name: 'Prepress' },
  { code: 'CUTTING',   name: 'Kesish/Bukish' },
  { code: 'WAREHOUSE', name: 'Ombor' },
  { code: 'OFFICE',    name: 'Ofis' },
  { code: 'OSHXONA',   name: 'Oshxona' },
  { code: 'SANITAR',   name: tLabel('common.InspectionPage.sanitarXonalar', 'Sanitar xonalar') },
] as const;

export const REFERENCE_PHOTO_ROLES = new Set(['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR']);
export const MANUAL_INSPECTION_ROLES = new Set(['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR', 'SECURITY']);

/**
 * @deprecated Auth tokens are httpOnly cookies; JavaScript cannot read them.
 * Use `apiRequest` / `apiFetch` (both attach `credentials: 'include'`) instead
 * of building auth headers manually. Returns '' so legacy callers degrade
 * gracefully — no token is ever actually attached to requests this way.
 */
export function getToken(): string {
  return '';
}

export async function apiFetch<T>(path: string): Promise<T> {
  return await apiRequest<T>('GET', path);
}
