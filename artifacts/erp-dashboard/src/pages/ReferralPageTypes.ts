
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module ReferralPageTypes
 * @description TypeScript interfaces, types, and constants for ReferralPage.
 */

export interface Referral {
  id: number;
  status: string;
  candidate_full_name: string;
  candidate_phone: string;
  position_title: string;
  bonus_paid: boolean;
  bonus_type: string;
  bonus_amount: string | number;
  created_at: string;
  referrer_name: string;
  referrer_id: number;
  hr_notes: string;
}

export interface BoomerangAlumni {
  id: number;
  full_name: string;
  department_name?: string;
  position_name?: string;
  last_day?: string;
  rehire_eligible?: boolean;
  status?: string;
}

export interface AddForm {
  candidate_full_name: string;
  candidate_phone: string;
  position_title: string;
}

export interface EditForm {
  status: string;
  bonus_type: string;
  bonus_amount: string;
  bonus_paid: boolean;
  hr_notes: string;
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: tLabel('common.ReferralPage.kutilmoqda', "Kutilmoqda"),     color: "bg-blue-100 text-[var(--ep-blue)]"  },
  interview: { label: "Intervyuda",     color: "bg-amber-100 text-[var(--ep-yellow)]" },
  hired:     { label: "Qabul qilindi",  color: "bg-green-100 text-[var(--ep-green)]" },
  rejected:  { label: "Rad etildi",     color: "bg-red-100 text-[var(--ep-red)]"    },
};
